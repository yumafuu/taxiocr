const timestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月は0始まりなので+1
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export const Analyze = async (
  file: File,
  apiKey: string,
  modelId: string,
) => {
  const authToken = btoa(`${apiKey}:`)

  const response = await ocr(file, authToken, modelId);
  const id = response.result[0].id;
  const result = await getResultsById(id, authToken, modelId);

  return result;
};

const ocr = async (file: File, authToken: string, modelId: string) => {
  const formData = new FormData();
  const fileContent = await file.arrayBuffer();
  const now = timestamp();
  formData.append("file", new Blob([fileContent]), `${now}_${file}`);

  const response = await fetch(
    `https://app.nanonets.com/api/v2/OCR/Model/${modelId}/LabelFile/`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authToken}`,
        "Accept": "application/json",
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch OCR: ${response.statusText}


Detail:
  text:     ${await response.text()}
  API_KEY:  ${authToken}
  MODEL_ID: ${modelId}
  `);
  }
  const result = await response.json();

  return result;
};

const getResultsById = async (
  id: string,
  authToken: string,
  modelId: string,
) => {

  const response = await fetch(
    `https://app.nanonets.com/api/v2/Inferences/Model/${modelId}/ImageLevelInferences/${id}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Basic ${authToken}`,
        "Accept": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch getDetail: ${response.statusText}
Detail:
  text:     ${await response.text()}
  API_KEY:  ${authToken}
  MODEL_ID: ${modelId}
`);
  }

  const result = await response.json();
  const trim = (str: string) =>
    str.
      replaceAll(" ", "").
      replaceAll("|", " ").
      replaceAll("乘", "乗").
      trim()

  const data = result.result[0].prediction[0].cells;
  const headers = data.filter((item) => item.row === 1).map((item) =>
    trim(item.text)
  );

  // chatgptに聞いたからロジック把握してない
  const rows = data
    .filter((item) => item.row !== 1) // row: 1を除外
    .reduce((acc, item) => {
      // accの適切な場所に値を追加
      if (!acc[item.row - 2]) acc[item.row - 2] = {};
      acc[item.row - 2][headers[item.col - 1]] = trim(item.text);
      return acc;
    }, []);
  return rows;
};
