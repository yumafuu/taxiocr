import { createRoot } from "react-dom/client";
import { useState } from "react";

function App() {
  return (
    <>
      <h1>Taxi OCR 🚖</h1>
      <ImageUploader />
      <ClockButton />
    </>
  );
}

const ImageUploader = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const fileChange = async (event) => {
    const [file] = event.target.files;
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const fileSubmit = async () => {
    const file = document.querySelector("input[name=file]").files[0];

    if (file || true) {
      const formData = new FormData();
      formData.append("file", file);

      setIsLoading(true);
      const res = await (await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })).json();
      setIsLoading(false);

      const { data } = res;
      setData(data);
    }
  };

  return (
    <div>
      <form>
        <div>
          <input
            name="file"
            type="file"
            accept="image/*"
            onChange={fileChange}
          />
        </div>
        <button
          type="button"
          onClick={fileSubmit}
          style={{
            marginTop: "12px",
            marginBottom: "12px",
          }}
        >
          {isLoading ? <span>Loading...</span> : <>Submit</>}
        </button>
        <div>
          { isLoading ? <span>10秒くらいかかります</span> : <></> }
        </div>

        <div>
          {preview
            ? (
              <img
                src={preview}
                style={{ width: "800px", marginBottom: "20px" }}
              />
            )
            : <></>}
        </div>
        <p>
          読み込みたい表だけ切り取ってアップロードしてください
        </p>

        </form>

      {
        data.length > 0 ? (
          <div id="result" style={{ width: "full" }}>
            <ResultTable data={data} />
          </div>
        ) : <></>
      }
    </div>
  );
};

const ResultTable = (props) => {
  const data = props.data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const toCsv = function (data: Object[]) {
    const headers = Object.keys(data[0]);

    const csvRows: string[] = [];

    csvRows.push(headers.join(","));
    const values = data.map((row: Object) => Object.values(row).join(","));
    values.forEach((row: string) => {
      csvRows.push(row)
    })

    return csvRows.join("\n");
  };

  const download = () => {
    if (data.length > 0) {
      const csv = toCsv(data);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // yyyyMMdd
      const now = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      a.download = `taxiocr_${now}.csv`;
      a.click();
    }
  }

  return (
    <div>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Result</h2>
        <button
          style={{ height: "20px", display: "block", marginTop: "auto", marginBottom: "auto" }}
          onClick={download}
        >
          Download
        </button>
      </span>
      <table style={{ width: "full", margin: "12px" }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, colIndex) => (
                <td key={colIndex}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
 };

const ClockButton = () => {
  const [response, setResponse] = useState<string | null>(null);

  const handleClick = async () => {
    const response = await fetch("/api/clock");
    const data = await response.json();
    const headers = Array.from(
      response.headers.entries(),
    ).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const fullResponse = {
      url: response.url,
      status: response.status,
      headers,
      body: data,
    };
    setResponse(JSON.stringify(fullResponse, null, 2));
  };

  return (
    <div>
      <button onClick={handleClick}>Get Server Time</button>
      {response && <pre>{response}</pre>}
    </div>
  );
};

const domNode = document.getElementById("root")!;
const root = createRoot(domNode);
root.render(<App />);
