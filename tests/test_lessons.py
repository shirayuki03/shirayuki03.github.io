"""Run with: python3 -m unittest discover -s tests -v"""
import copy
import json
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class CourseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        script = '''const fs=require('fs'); global.window={};
        eval(fs.readFileSync('tutorial-data.js','utf8'));
        eval(fs.readFileSync('lesson-data.js','utf8'));
        process.stdout.write(JSON.stringify(window.ClambonTutorialData));'''
        cls.course = json.loads(subprocess.check_output(['node', '-e', script], cwd=ROOT))
        cls.lessons = {item['id']: item for item in cls.course['lessons']}
        cls.runtime = {}
        exec((ROOT / 'clambon_runtime.py').read_text(), cls.runtime)
        exec((ROOT / 'lesson_validation.py').read_text(), cls.runtime)
        cls.runtime['init_runtime']((ROOT / 'grammar.lark').read_text())
        cls.runtime['set_handlers'](lambda value: None)

    def assess(self, lesson_id, source):
        return self.runtime['assess_lesson'](source, self.lessons[lesson_id])

    def test_curriculum_and_translations(self):
        self.assertEqual(len(self.course['chapters']), 7)
        self.assertEqual(len(self.lessons), 28)
        for chapter in self.course['chapters']:
            self.assertEqual(sum(item['chapter'] == chapter['id'] for item in self.lessons.values()), 4)
        for item in self.lessons.values():
            for key in ('title', 'concept', 'task', 'hints', 'prediction'):
                self.assertTrue(item[key])
                self.assertTrue(item['en'][key])
            for key in ('prediction',):
                for version in (item[key], item['en'][key]):
                    self.assertIn(version['answer'], range(len(version['choices'])))

    def test_every_example_and_solution_runs_and_passes(self):
        for item in self.lessons.values():
            with self.subTest(lesson=item['id']):
                for key in ('sample', 'solution'):
                    self.runtime['reset_state']()
                    result = self.runtime['run_code'](item[key])
                    self.assertTrue(result['ok'], (key, result.get('error')))
                self.assertTrue(self.assess(item['id'], item['solution'])['ok'])

    def test_boundaries_and_hardcoded_function_results_fail(self):
        source = 'var score = 80\nif <score > 59> { print("合格") }'
        self.assertEqual(self.assess('if', source)['reason'], 'case')
        source = 'define twice(x) { return 8 }\nprint(twice(4))'
        self.assertEqual(self.assess('return', source)['reason'], 'case')
        self.assertFalse(self.assess('repeat', 'print("Clambon")\nprint("Clambon")\nprint("Clambon")')['ok'])
        self.assertFalse(self.assess('variable', 'var value = 20\nprint(20)')['ok'])

    def test_renaming_and_alternative_correct_solutions(self):
        source = 'define twice(value) { return value + value }\nprint(twice(4))'
        self.assertTrue(self.assess('return', source)['ok'])
        source = 'var value = 80\nif <60 < value> { print("合格") }'
        self.assertTrue(self.assess('if', source)['ok'])
        source = 'var points = 80\nif <points > 60> { print("合格") }'
        self.assertTrue(self.assess('if', source)['ok'])
        source = 'define priceFor(p, n) { return n * p }\nprint(priceFor(120, 3))'
        self.assertTrue(self.assess('total-function', source)['ok'])

    def test_strings_and_unexecuted_code_cannot_satisfy_syntax(self):
        source = 'print("Clambon")\nprint("Clambon")\nprint("Clambon")\ndefine unused() { repeat(3) { print("Clambon") } }'
        self.assertEqual(self.assess('repeat', source)['reason'], 'syntax')

    def test_validation_preserves_runtime_and_output(self):
        self.runtime['reset_state']()
        self.runtime['run_code']('var kept = 42\ndefine keptFn(n) { return n + 1 }')
        before = copy.deepcopy(self.runtime['variables'])
        original_functions = set(self.runtime['functions'])
        captured = []
        self.runtime['set_handlers'](captured.append)
        self.assertTrue(self.assess('total-function', self.lessons['total-function']['solution'])['ok'])
        self.assertEqual(captured, [])
        self.assertEqual(self.runtime['variables'], before)
        self.assertEqual(set(self.runtime['functions']), original_functions)
        self.runtime['set_handlers'](lambda value: None)

    def test_invalid_and_nonterminating_programs_are_bounded(self):
        for source in ('print(', 'var n = 1\nrepeat <n == 0> { print(n) }', 'forever { print(1) }'):
            self.assertFalse(self.assess('until', source)['ok'])


if __name__ == '__main__':
    unittest.main()
