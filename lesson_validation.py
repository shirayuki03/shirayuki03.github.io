"""Isolated, bounded course checks. Never emit output or checkpoints to the UI."""
import copy


def assess_lesson(source, specification):
    global output_handler
    if specification.get("free"):
        return {"ok": True}
    course_parser = Lark(base_grammar_text, parser="lalr")
    saved_variables = copy.deepcopy(variables)
    saved_functions = copy.deepcopy(functions)
    saved_output = output_handler

    class CourseRunner(ToMyLang):
        def __init__(self):
            super().__init__()
            self.visited = set()
            self.budget = 10000

        def visit(self, tree):
            self.budget -= 1
            if self.budget < 0:
                raise ClambonError("課題の実行回数が多すぎます。")
            self.visited.add(str(tree.data))
            if str(tree.data) == "if_" and len(tree.children) > 2 and tree.children[2] is not None:
                self.visited.add("else_block")
            return super().visit(tree)

        def _checkpoint(self):
            self.budget -= 1
            if self.budget < 0:
                raise ClambonError("課題の実行回数が多すぎます。")

        def wait(self, tree):
            raise ClambonError("この課題ではwaitは使いません。")

        def forever(self, tree):
            raise ClambonError("この課題ではforeverは使いません。")

        def repeat(self, tree):
            if len(tree.children) < 2:
                raise ClambonError("繰り返す命令を入れてください。")
            return super().repeat(tree)

    def execute(tree):
        nonlocal captured
        captured = []
        variables.clear()
        functions.clear()
        runner = CourseRunner()
        for command in top_level_commands(tree):
            runner.visit_command(command)
        return runner

    def matches(output):
        expected = specification.get("expected")
        if expected is not None:
            return output == [str(value) for value in expected]
        bounds = specification.get("range")
        if bounds:
            return len(output) == bounds["count"] and all(
                re.fullmatch(r"-?\d+", line) and bounds["min"] <= int(line) <= bounds["max"] for line in output
            )
        choices = specification.get("oneOf")
        return choices is not None and len(output) == 1 and output[0] in choices

    captured = []
    output_handler = lambda value: captured.append(str(value))
    try:
        tree = course_parser.parse(source)
        runner = execute(copy.deepcopy(tree))
        if not matches(captured):
            return {"ok": False, "reason": "output"}
        required = set(specification.get("nodes") or [])
        if not required.issubset(runner.visited):
            return {"ok": False, "reason": "syntax"}
        for case in specification.get("tests") or []:
            changed = copy.deepcopy(tree)
            if "callArgs" in case:
                # Select by structure, allowing learners to choose their own function name.
                definitions = list(changed.find_data("define"))
                if not definitions:
                    return {"ok": False, "reason": "syntax"}
                definition = definitions[0]
                commands = []
                for command in top_level_commands(changed):
                    raw = runner.unwrap_command(command)
                    if str(raw.data) in ("define", "var"):
                        commands.append(command)
                args = ", ".join(json.dumps(value, ensure_ascii=False) for value in case["callArgs"])
                call = f"{definition.children[0]}({args})"
                if case.get("printReturn"):
                    call = f"print({call})"
                test_runner = CourseRunner()
                captured = []
                variables.clear()
                functions.clear()
                for command in commands:
                    test_runner.visit_command(command)
                for command in top_level_commands(course_parser.parse(call)):
                    test_runner.visit_command(command)
            else:
                declarations = [runner.unwrap_command(command) for command in top_level_commands(changed)
                                if str(runner.unwrap_command(command).data) == "var"]
                for index_key, value_key in (("inputIndex", "value"), ("inputIndex2", "value2")):
                    if index_key not in case:
                        continue
                    index = case[index_key]
                    if index >= len(declarations):
                        return {"ok": False, "reason": "case"}
                    replacement = course_parser.parse("var course_value = " + json.dumps(case[value_key], ensure_ascii=False))
                    replacement = runner.unwrap_command(top_level_commands(replacement)[0])
                    declarations[index].children[1] = replacement.children[1]
                execute(changed)
            if captured != [str(value) for value in case["expected"]]:
                return {"ok": False, "reason": "case"}
        return {"ok": True}
    except Exception:
        return {"ok": False, "reason": "error"}
    finally:
        variables.clear()
        variables.update(saved_variables)
        functions.clear()
        functions.update(saved_functions)
        output_handler = saved_output
