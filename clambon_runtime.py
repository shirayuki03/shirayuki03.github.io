from lark import Lark
from lark.exceptions import UnexpectedInput
from lark.visitors import Interpreter
import base64
import asyncio
import json
import math
import pickle
import random as random_module
import re
import time
from sympy import N, zoo, rad, pi
from sympy import sqrt as sympy_sqrt
from sympy import sin as sympy_sin
from sympy import cos as sympy_cos
from sympy import tan as sympy_tan
from sympy import asin as sympy_asin
from sympy import acos as sympy_acos
from sympy import atan as sympy_atan
from sympy import ln as sympy_ln
from sympy import log as sympy_log
from sympy import exp as sympy_exp


variables = {}
functions = {}
parser = None
base_grammar_text = ""
configured_extensions = {}
active_extension_names = []
extension_inputs = {}
output_handler = None
checkpoint_handler = None
extension_handler = None


class ClambonError(Exception):
    pass


class ReturnSignal(Exception):
    def __init__(self, value):
        self.value = value


class TaskCancelled(Exception):
    pass


def set_handlers(next_output_handler=None, next_checkpoint_handler=None, next_extension_handler=None):
    global output_handler, checkpoint_handler, extension_handler
    output_handler = next_output_handler
    checkpoint_handler = next_checkpoint_handler
    extension_handler = next_extension_handler


def init_runtime(grammar_text, extensions=None):
    global base_grammar_text
    base_grammar_text = grammar_text
    configure_extensions(extensions or [])
    rebuild_parser([])
    reset_state()


def configure_extensions(extensions):
    configured_extensions.clear()
    for package in extensions or []:
        name = str(package.get("name", "")).strip()
        grammar_text = package.get("grammarText") or ""
        python_text = package.get("pythonText") or ""
        if not name or not python_text:
            continue

        configured_extensions[name] = {
            "name": name,
            "rule": name.lower(),
            "grammar": grammar_text,
            "python": python_text,
            "metadata": package,
        }
        exec(python_text, globals())


def set_extension_input(payload):
    extension_inputs.clear()
    if payload:
        extension_inputs.update(payload)


def get_extension_input(name, default=None):
    return extension_inputs.get(name, default)


def emit_extension_event(name, event_type, payload=None):
    if extension_handler:
        extension_handler(str(name), str(event_type), json.dumps(payload or {}))


def find_imports(source):
    return re.findall(r"^\s*import\s+([A-Za-z_][A-Za-z0-9_]*)\s*$", source, flags=re.MULTILINE)


def rebuild_parser(imports):
    global parser, active_extension_names
    missing = [name for name in imports if name not in configured_extensions]
    if missing:
        raise ClambonError(f"{', '.join(missing)} はまだ追加されていない拡張機能です。")

    active_extension_names = list(dict.fromkeys(imports))
    grammar = compose_grammar(active_extension_names)
    parser = Lark(grammar, parser="lalr")


def compose_grammar(imports):
    lines = []
    for line in base_grammar_text.splitlines():
        if line.startswith("cmd:"):
            lines.append("cmd: clambon")
            for name in imports:
                if configured_extensions[name]["grammar"].strip():
                    lines.append(f"    | {configured_extensions[name]['rule']}")
        else:
            lines.append(line)

    for name in imports:
        grammar = configured_extensions[name]["grammar"]
        if grammar.strip():
            lines.append("")
            lines.append(grammar)
    return "\n".join(lines)


def preprocess_source(source):
    transformed = source
    for name in active_extension_names:
        preprocessor = globals().get(f"{name}_preprocess_source")
        if callable(preprocessor):
            transformed = preprocessor(transformed)
            if not isinstance(transformed, str):
                raise ClambonError(f"{name} のソース変換結果が文字列ではありません。")
    return transformed


def reset_state():
    variables.clear()
    functions.clear()
    reset_extension_state()
    return export_state()


def export_state():
    payload = {
        "variables": variables,
        "functions": functions,
        "extensions": export_extension_state(),
    }
    return base64.b64encode(pickle.dumps(payload)).decode("ascii")


def import_state(snapshot):
    if not snapshot:
        return export_state()

    payload = pickle.loads(base64.b64decode(snapshot.encode("ascii")))
    variables.clear()
    variables.update(payload.get("variables", {}))
    functions.clear()
    functions.update(payload.get("functions", {}))
    import_extension_state(payload.get("extensions", {}))
    return export_state()


def reset_extension_state():
    for name in list(configured_extensions):
        resetter = globals().get(f"{name}_reset_state")
        if callable(resetter):
            resetter()


def export_extension_state():
    state = {}
    for name in active_extension_names:
        exporter = globals().get(f"{name}_export_state")
        if callable(exporter):
            state[name] = exporter()
    return state


def import_extension_state(state):
    for name, value in (state or {}).items():
        importer = globals().get(f"{name}_import_state")
        if callable(importer):
            importer(value)


def emit_output(value):
    text = str(value)
    if output_handler:
        output_handler(text)
    else:
        print(text)


def emit_checkpoint():
    snapshot = export_state()
    if checkpoint_handler:
        checkpoint_handler(snapshot)
    return snapshot


def friendly_error(error):
    if isinstance(error, UnexpectedInput):
        return f"文法を確認してね。{error.line}行目、{error.column}文字目あたりで読み取れませんでした。"
    if isinstance(error, ClambonError):
        return str(error)
    return f"実行中にエラーが起きました: {error}"


def run_code(source, restore_state=None):
    if not base_grammar_text:
        raise ClambonError("実行エンジンの準備がまだ終わっていません。")

    if not source.strip():
        return {"ok": True, "checkpoint": emit_checkpoint()}

    try:
        rebuild_parser(find_imports(source))
        if restore_state:
            import_state(restore_state)

        tree = parser.parse(preprocess_source(source))
        runner = create_interpreter()
        for cmd in top_level_commands(tree):
            runner.visit_command(cmd)
            emit_checkpoint()
        runner.run_start_scripts()
        return {"ok": True, "checkpoint": emit_checkpoint()}
    except ReturnSignal:
        return {"ok": False, "error": "return は define の中だけで使えます。", "checkpoint": emit_checkpoint()}
    except Exception as error:
        return {"ok": False, "error": friendly_error(error), "checkpoint": emit_checkpoint()}


async def run_code_async(source, restore_state=None):
    if not base_grammar_text:
        raise ClambonError("実行エンジンの準備がまだ終わっていません。")

    if not source.strip():
        return {"ok": True, "checkpoint": emit_checkpoint()}

    try:
        rebuild_parser(find_imports(source))
        if restore_state:
            import_state(restore_state)

        tree = parser.parse(preprocess_source(source))
        runner = create_interpreter()
        for cmd in top_level_commands(tree):
            runner.visit_command(cmd)
            emit_checkpoint()
        await runner.run_start_scripts_async()
        return {"ok": True, "checkpoint": emit_checkpoint()}
    except ReturnSignal:
        return {"ok": False, "error": "return は define の中だけで使えます。", "checkpoint": emit_checkpoint()}
    except Exception as error:
        return {"ok": False, "error": friendly_error(error), "checkpoint": emit_checkpoint()}


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _normalize_number(value):
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def top_level_commands(tree):
    if getattr(tree, "data", None) == "start":
        return tree.children
    return [tree]


def create_interpreter():
    classes = [ToMyLang]
    for name in active_extension_names:
        class_name = f"{name}_main"
        extension_class = globals().get(class_name)
        if extension_class is None:
            raise ClambonError(f"{name} の {class_name} クラスが見つかりません。")
        classes.append(extension_class)

    MixedInterpreter = type("MixedInterpreter", tuple(classes), {})
    runner = MixedInterpreter(checkpoint_callback=emit_checkpoint)
    for name in active_extension_names:
        setup = getattr(runner, f"{name}_setup", None)
        if callable(setup):
            setup()
    return runner


class ToMyLang(Interpreter):
    def __init__(self, checkpoint_callback=None):
        self.scopes = [variables]
        self.functions = functions
        self.checkpoint_callback = checkpoint_callback
        self.start_scripts = []
        self.runtime_tasks = []
        super().__init__()

    def _checkpoint(self):
        if self.checkpoint_callback:
            self.checkpoint_callback()

    def visit_command(self, command):
        return self.visit(self.unwrap_command(command))

    def unwrap_command(self, command):
        while (
            hasattr(command, "data")
            and len(command.children) == 1
            and hasattr(command.children[0], "data")
            and not callable(getattr(type(self), str(command.data), None))
        ):
            command = command.children[0]
        return command

    def register_start_script(self, commands):
        self.start_scripts.append(list(commands))

    def register_runtime_script(self, commands, context=None):
        self.runtime_tasks.append({
            "generator": self._run_commands(list(commands)),
            "context": context,
            "sleep_until": 0,
        })

    def cancel_current_task(self):
        raise TaskCancelled()

    def run_start_scripts(self):
        for commands in self.start_scripts:
            self.register_runtime_script(commands)

        while self.runtime_tasks:
            now = time.monotonic()
            tasks = self.runtime_tasks
            self.runtime_tasks = []
            active_tasks = []

            for task in tasks:
                if task.get("sleep_until", 0) > now:
                    active_tasks.append(task)
                    continue

                previous_context = None
                activate = getattr(self, "activate_task_context", None)
                restore = getattr(self, "restore_task_context", None)
                if callable(activate):
                    previous_context = activate(task["context"])

                try:
                    yielded = next(task["generator"])
                    if isinstance(yielded, tuple) and yielded[0] == "sleep_until":
                        task["sleep_until"] = yielded[1]
                    else:
                        task["sleep_until"] = 0
                    active_tasks.append(task)
                except StopIteration:
                    pass
                except TaskCancelled:
                    pass
                finally:
                    if callable(restore):
                        restore(previous_context)

            self.runtime_tasks = active_tasks + self.runtime_tasks
            hook = getattr(self, "on_scheduler_tick", None)
            if callable(hook):
                hook()
            time.sleep(0.001)

    async def run_start_scripts_async(self):
        for commands in self.start_scripts:
            self.register_runtime_script(commands)

        while self.runtime_tasks:
            now = time.monotonic()
            tasks = self.runtime_tasks
            self.runtime_tasks = []
            active_tasks = []

            for task in tasks:
                if task.get("sleep_until", 0) > now:
                    active_tasks.append(task)
                    continue

                previous_context = None
                activate = getattr(self, "activate_task_context", None)
                restore = getattr(self, "restore_task_context", None)
                if callable(activate):
                    previous_context = activate(task["context"])

                try:
                    yielded = next(task["generator"])
                    if isinstance(yielded, tuple) and yielded[0] == "sleep_until":
                        task["sleep_until"] = yielded[1]
                    else:
                        task["sleep_until"] = 0
                    active_tasks.append(task)
                except StopIteration:
                    pass
                except TaskCancelled:
                    pass
                finally:
                    if callable(restore):
                        restore(previous_context)

            self.runtime_tasks = active_tasks + self.runtime_tasks
            hook = getattr(self, "on_scheduler_tick", None)
            if callable(hook):
                hook()
            await asyncio.sleep(1 / 60)

    def _run_commands(self, commands):
        for command in commands:
            yield from self._run_command(command)

    def _run_command(self, command):
        command = self.unwrap_command(command)
        command_name = str(command.data)

        if command_name == "forever":
            while True:
                yield from self._run_commands(command.children)
                yield

        elif command_name == "wait":
            value = self.visit(command.children[0])
            if isinstance(value, bool):
                condition = command.children[0]
                while not self.visit(condition):
                    yield
            else:
                wake_at = time.monotonic() + self._resolve(value)
                while time.monotonic() < wake_at:
                    yield ("sleep_until", wake_at)

        elif command_name == "if_":
            condition = self.visit(command.children[0])
            if condition:
                yield from self._run_commands(command.children[1].children)
            elif len(command.children) > 2 and command.children[2] is not None:
                yield from self._run_commands(command.children[2].children)

        elif command_name == "repeat":
            value = self.visit(command.children[0])
            block = command.children[1:]
            if isinstance(value, bool):
                condition = command.children[0]
                while not self.visit(condition):
                    yield from self._run_commands(block)
                    yield
            else:
                for _ in range(self._resolve(value)):
                    yield from self._run_commands(block)
                    yield

        else:
            self.visit(command)
            yield

    def _current_scope(self):
        return self.scopes[-1]

    def _get_var(self, name):
        for scope in reversed(self.scopes):
            if name in scope:
                return scope[name]
        return None

    def _set_var(self, name, value):
        for scope in reversed(self.scopes):
            if name in scope:
                scope[name] = value
                return
        self._current_scope()[name] = value

    def _resolve(self, value):
        if isinstance(value, str):
            var_value = self._get_var(value)
            return var_value if var_value is not None else value
        return value

    def _resolve_var_name(self, tree):
        name = str(tree.children[0])
        if len(tree.children) > 1 and tree.children[1] is not None:
            index = self._resolve(self.visit(tree.children[1]))
            if not isinstance(index, int):
                raise ClambonError("リストの位置には整数を使ってね。")
            return name, index
        return name, None

    def negative(self, tree):
        return 0 - self._resolve(self.visit(tree.children[0]))

    def number(self, tree):
        raw = str(tree.children[0])
        return float(raw) if "." in raw else int(raw)

    def string(self, tree):
        return str(tree.children[0])[1:-1]

    def boolean(self, tree):
        return str(tree.children[0]) == "true"

    def value(self, tree):
        return self.visit(tree.children[0])

    def array(self, tree):
        return [self._resolve(self.visit(child)) for child in tree.children if child is not None]

    def wait(self, tree):
        first = tree.children[0]
        value = self.visit(first)
        if isinstance(value, bool):
            while not self.visit(first):
                time.sleep(0.1)
        else:
            duration = self._resolve(value)
            if not _is_number(duration):
                raise ClambonError("wait には秒数か条件を書いてね。")
            time.sleep(max(0, duration))

    def repeat(self, tree):
        first = tree.children[0]
        first_value = self.visit(first)
        block = tree.children[1:]
        if isinstance(first_value, bool):
            while not self.visit(first):
                for cmd in block:
                    self.visit_command(cmd)
                    self._checkpoint()
        elif isinstance(first_value, int):
            for _ in range(first_value):
                for cmd in block:
                    self.visit_command(cmd)
                    self._checkpoint()
        else:
            raise ClambonError("repeat には回数か条件を書いてね。")

    def forever(self, tree):
        while True:
            for cmd in tree.children:
                self.visit_command(cmd)
                self._checkpoint()

    def if_(self, tree):
        condition = self.visit(tree.children[0])
        then_block = tree.children[1]
        else_block = tree.children[2] if len(tree.children) > 2 else None
        target = then_block if condition else else_block
        if target:
            for cmd in target.children:
                self.visit_command(cmd)
                self._checkpoint()

    def import_(self, tree):
        return str(tree.children[0])

    def add(self, tree):
        return self._resolve(self.visit(tree.children[0])) + self._resolve(self.visit(tree.children[1]))

    def subtract(self, tree):
        return self._resolve(self.visit(tree.children[0])) - self._resolve(self.visit(tree.children[1]))

    def multiply(self, tree):
        return self._resolve(self.visit(tree.children[0])) * self._resolve(self.visit(tree.children[1]))

    def divide(self, tree):
        return self._resolve(self.visit(tree.children[0])) / self._resolve(self.visit(tree.children[1]))

    def mod(self, tree):
        return self._resolve(self.visit(tree.children[0])) % self._resolve(self.visit(tree.children[1]))

    def pow(self, tree):
        left = self._resolve(self.visit(tree.children[0]))
        right = self._resolve(self.visit(tree.children[1]))
        return left ** right

    def random(self, tree):
        start = self._resolve(self.visit(tree.children[0]))
        end = self._resolve(self.visit(tree.children[1]))
        if isinstance(start, int) and isinstance(end, int):
            return random_module.randint(start, end)
        return random_module.uniform(start, end)

    def equal(self, tree):
        return self._resolve(self.visit(tree.children[0])) == self._resolve(self.visit(tree.children[1]))

    def greater(self, tree):
        return self._resolve(self.visit(tree.children[0])) > self._resolve(self.visit(tree.children[1]))

    def less(self, tree):
        return self._resolve(self.visit(tree.children[0])) < self._resolve(self.visit(tree.children[1]))

    def and_(self, tree):
        return self._resolve(self.visit(tree.children[0])) and self._resolve(self.visit(tree.children[1]))

    def or_(self, tree):
        return self._resolve(self.visit(tree.children[0])) or self._resolve(self.visit(tree.children[1]))

    def not_(self, tree):
        return not self._resolve(self.visit(tree.children[0]))

    def join(self, tree):
        left = self._resolve(self.visit(tree.children[0]))
        right = self._resolve(self.visit(tree.children[1]))
        if isinstance(left, bool) or isinstance(right, bool):
            raise ClambonError("join では true/false をつなげられません。")
        if isinstance(left, str) or isinstance(right, str):
            return str(left) + str(right)
        return int(str(left) + str(right))

    def letter(self, tree):
        index = self._resolve(self.visit(tree.children[0]))
        text = self._resolve(self.visit(tree.children[1]))
        if not isinstance(index, int) or not isinstance(text, str):
            raise ClambonError("letter には文字列と整数の位置を使ってね。")
        if index < 1 or index > len(text):
            raise ClambonError("letter の位置が文字列の長さをこえています。")
        return text[index - 1]

    def length(self, tree):
        value = self._resolve(self.visit(tree.children[0]))
        if isinstance(value, int):
            value = str(value)
        if not isinstance(value, str):
            raise ClambonError("length には文字列か数値を使ってね。")
        return len(value)

    def contains(self, tree):
        container = self._resolve(self.visit(tree.children[0]))
        item = self._resolve(self.visit(tree.children[1]))
        if isinstance(container, list):
            return item in container
        if isinstance(container, (int, float, str)) and isinstance(item, (int, float, str)):
            return str(item) in str(container)
        raise ClambonError("contains で調べられるのは、文字列・数値・リストです。")

    def round(self, tree):
        return round(self._resolve(self.visit(tree.children[0])))

    def abs(self, tree):
        return abs(self._resolve(self.visit(tree.children[0])))

    def floor(self, tree):
        return math.floor(self._resolve(self.visit(tree.children[0])))

    def ceiling(self, tree):
        return math.ceil(self._resolve(self.visit(tree.children[0])))

    def sqrt(self, tree):
        result = float(N(sympy_sqrt(self._resolve(self.visit(tree.children[0])))))
        return _normalize_number(result)

    def sin(self, tree):
        return float(N(sympy_sin(rad(self._resolve(self.visit(tree.children[0]))))))

    def cos(self, tree):
        return float(N(sympy_cos(rad(self._resolve(self.visit(tree.children[0]))))))

    def tan(self, tree):
        value = N(sympy_tan(rad(self._resolve(self.visit(tree.children[0])))))
        return None if value == zoo else float(value)

    def asin(self, tree):
        result = float(N(sympy_asin(self._resolve(self.visit(tree.children[0]))) * 180 / pi))
        return _normalize_number(result)

    def acos(self, tree):
        result = float(N(sympy_acos(self._resolve(self.visit(tree.children[0]))) * 180 / pi))
        return _normalize_number(result)

    def atan(self, tree):
        result = float(N(sympy_atan(self._resolve(self.visit(tree.children[0]))) * 180 / pi))
        return _normalize_number(result)

    def ln(self, tree):
        value = N(sympy_ln(self._resolve(self.visit(tree.children[0]))))
        return None if value == zoo else float(value)

    def log(self, tree):
        value = N(sympy_log(self._resolve(self.visit(tree.children[0])), 10))
        return None if value == zoo else _normalize_number(float(value))

    def napier(self, tree):
        return float(N(sympy_exp(1)))

    def var(self, tree):
        name, index = self._resolve_var_name(tree.children[0])
        value = self._resolve(self.visit(tree.children[1]))
        if index is None:
            self._set_var(name, value)
            return
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        target[index - 1] = value

    def assignment(self, tree):
        self.var(tree)

    def var_name(self, tree):
        name, index = self._resolve_var_name(tree)
        if index is None:
            return name
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        if index < 1 or index > len(target):
            raise ClambonError(f"{name} の {index} 番目はありません。")
        return target[index - 1]

    def append(self, tree):
        name = str(tree.children[0].children[0])
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        target.append(self._resolve(self.visit(tree.children[1])))

    def delete(self, tree):
        name = str(tree.children[0].children[0])
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        raw_index = tree.children[1]
        if str(raw_index) == "all":
            target.clear()
            return
        index = self._resolve(self.visit(raw_index))
        if not isinstance(index, int) or index < 1 or index > len(target):
            raise ClambonError("delete の位置がリストの範囲外です。")
        del target[index - 1]

    def insert(self, tree):
        name = str(tree.children[0].children[0])
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        value = self._resolve(self.visit(tree.children[1]))
        index = self._resolve(self.visit(tree.children[2]))
        if not isinstance(index, int):
            raise ClambonError("insert の位置には整数を使ってね。")
        target.insert(max(0, index - 1), value)

    def item(self, tree):
        name = str(tree.children[0].children[0])
        target = self._get_var(name)
        value = self._resolve(self.visit(tree.children[1]))
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        if value not in target:
            raise ClambonError(f"{value} は {name} に入っていません。")
        return target.index(value) + 1

    def length_list(self, tree):
        name = str(tree.children[0].children[0])
        target = self._get_var(name)
        if not isinstance(target, list):
            raise ClambonError(f"{name} はリストではありません。")
        return len(target)

    def print_(self, tree):
        emit_output(self._resolve(self.visit(tree.children[0])))

    def define(self, tree):
        name = str(tree.children[0])
        params = []
        body_start = 1
        if len(tree.children) > 1 and getattr(tree.children[1], "data", None) == "param_list":
            params = [str(param) for param in tree.children[1].children]
            body_start = 2
        elif len(tree.children) > 1 and tree.children[1] is None:
            body_start = 2
        self.functions[name] = {"params": params, "body": tree.children[body_start:]}

    def function_call(self, tree):
        name = str(tree.children[0])
        if name not in self.functions:
            raise ClambonError(f"{name} という関数はまだ定義されていません。")

        function = self.functions[name]
        params = function["params"]
        args = []
        if len(tree.children) > 1 and tree.children[1] is not None:
            args = [self._resolve(self.visit(arg)) for arg in tree.children[1].children]
        if len(args) != len(params):
            raise ClambonError(f"{name} に渡す値の数が合っていません。")

        local_scope = dict(zip(params, args))
        self.scopes.append(local_scope)
        try:
            for cmd in function["body"]:
                self.visit_command(cmd)
            return None
        except ReturnSignal as signal:
            return signal.value
        finally:
            self.scopes.pop()

    def return_(self, tree):
        raise ReturnSignal(self._resolve(self.visit(tree.children[0])))
