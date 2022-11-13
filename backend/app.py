import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
import IPython as ipy
from IPython.utils.io import capture_output
from contextlib import redirect_stdout
from IPython.terminal.interactiveshell import TerminalInteractiveShell

app = Flask(__name__)
CORS(app)

shell = TerminalInteractiveShell.instance()

# run code in ipython instance, and capture stdout and stderr
def evaluate_cell(code):
    with capture_output() as io:
        result = shell.run_cell(code)
    return (io, result)


@app.route('/', methods=['GET'])
def index():
    return 'Hello World'

def get_error(result):
    if result.error_in_exec:
        return str(result.error_in_exec)
    else:
        return None

@app.route('/eval', methods=['POST'])
def api():
    data = request.get_json()
    code = data['code']
    (io, result) = evaluate_cell(code)
    print(result)
    return jsonify({
        'result': result.result,
        'error': get_error(result),
        'stdout': io.stdout,
        'stderr': io.stderr,
        })

if __name__ == '__main__':
    app.run(debug=True)
