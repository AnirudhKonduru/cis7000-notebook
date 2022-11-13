import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { randomUUID } from 'crypto';
import * as uuid from 'uuid';
import TextAreaResize from 'react-textarea-autosize';
import Ansi from 'ansi-to-react';

// simple jupyter notebook implementation

// component to display the output of a code cell
function OutputCell({ output, error }: { output: string, error: string }) {

  console.log("outputQ", output);
  console.log("errorQ", error);

  return (
    <div className="output-cell">
      <div className="output-cell-content">
        { /* for each line in output, render as Ansi */
          output.toString()
            .split("\n")
            .map((line, i) =>
              <Ansi key={i} className="output-cell-line" linkify={true}>{line}</Ansi>)
        }
      </div>
    </div>
  );
}

class CodeCellData {
  id: string;
  code: string;
  output: string;
  error: string;

  constructor(code: string) {
    this.id = uuid.v4();
    this.code = code;
    this.output = '';
    this.error = '';
  }
}


// component to display a code cell
function CodeCell({ data, updateData, setSelection, selected }: {
  data: CodeCellData,
  updateData: ((data: CodeCellData) => void),
  setSelection: (idx: string) => void
  selected: boolean
}) {
  let [code, setCode] = React.useState(data.code);
  let [isRunning, setIsRunning] = React.useState(false);


  console.log("idx in cell", data.id);
  console.log("selectionfn", setSelection);
  return (
    <div>
      <div
        style={{ backgroundColor: selected ? "lightblue" : "white" }}
        onClick={() => setSelection(data.id)} className="code-cell-container">
        <TextAreaResize
          className='code-cell'
          value={code}
          onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setCode(e.target.value)}
          onClick={() => setSelection(data.id)}
          onSelect={(_: any) => setSelection(data.id)}
        />

        <button
          className="run-button"
          onClick={async () => {
            setIsRunning(true);
            try {
              let response = await fetch('http://127.0.0.1:5000/eval', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
              });
              let result = await response.json();
              updateData({ ...data, code: code, output: result.stdout, error: result.stderr });
            } catch (e: any) {
              updateData({ ...data, code: code, error: e.toString() });
            }
            setIsRunning(false);
          }}
          disabled={isRunning}
        > Run </button>
      </div>
      <OutputCell output={data.output} error={data.error} />
    </div>
  );
}

// buttons to add and remove code cells
function CodeCellButtons({ addCell, removeCell }: { addCell: () => void, removeCell: () => void }) {
  return (
    <div className="button-bar">
      <button onClick={addCell}>Add cell</button>
      <button onClick={removeCell}>Remove cell</button>
    </div>
  );
}

function App() {
  // title of the notebook
  let [title, setTitle] = React.useState(
    localStorage.getItem('title') || 'Untitled'
  );
  useEffect(() => {
    localStorage.setItem('title', title);
  }, [title]);

  // state to store the current cell

  let [currentCell, setCurrentCell] = React.useState(-1);

  // set selection callback
  let setSelection = (key: string) => {
    cells.find((cell, index) => {
      if (cell.id === key) {
        setCurrentCell(index);
        return true;
      }
      return false;
    });
  };

  // update data callback
  let updateData = (data: CodeCellData) => {
    let newCells = cells.map((cell) => {
      if (cell.id === data.id) {
        return data;
      }
      return cell;
    });
    setCells(newCells);
  };


  let cellsFromLocalStorage = localStorage.getItem('cells');
  let cellsFromLocalStorageParsed: CodeCellData[] = cellsFromLocalStorage ?
    JSON.parse(cellsFromLocalStorage) : [new CodeCellData('')];

  // state to store the cells
  let [cells, setCells] = React.useState(cellsFromLocalStorageParsed);

  React.useEffect(() => {
    localStorage.setItem('cells', JSON.stringify(cells));
  }, [cells]);


  // add a new cell
  let addCell = () => {
    let newCells = cells.slice();
    // add cell after the current cell
    newCells.splice(currentCell + 1, 0, new CodeCellData(''));
    setCells(newCells);
  };

  // remove a cell
  let removeCell = () => {
    if (cells.length === 1) {
      return;
    }
    console.log("old cells", cells);
    let newCells = cells.slice();
    newCells.splice(currentCell, 1);
    setCells(newCells);
    console.log("new cells", newCells);
    setCurrentCell(-1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="title-bar">
          <input className='title' value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <CodeCellButtons addCell={addCell} removeCell={removeCell} />
        <div className="cells">


          {cells.map((cell, index) => (
            <CodeCell key={cell.id} data={cell} selected={index === currentCell} updateData={updateData} setSelection={setSelection} />
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
