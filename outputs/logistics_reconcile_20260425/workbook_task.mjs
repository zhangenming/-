import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "/Users/zem/zm/未命名文件夹/物流对账(1).xlsx";
const outputDir = "/Users/zem/zm/AI/outputs/logistics_reconcile_20260425";
const outputPath = `${outputDir}/物流对账(1)_总表联动版.xlsx`;
const mode = process.argv[2] || "inspect";
const subSheetNames = Array.from({ length: 31 }, (_, index) => `2026.5.${index + 1}`);

async function loadWorkbook() {
  const input = await FileBlob.load(inputPath);
  return SpreadsheetFile.importXlsx(input);
}

async function inspectWorkbook() {
  const workbook = await loadWorkbook();
  const ranges = [
    "总表!A1:W15",
    "2026.5.1!A1:W15",
    "2026.5.2!A1:W15"
  ];

  for (const range of ranges) {
    const result = await workbook.inspect({
      kind: "table",
      range,
      include: "values,formulas",
      tableMaxRows: 15,
      tableMaxCols: 23
    });
    process.stdout.write(`\n=== ${range} ===\n`);
    process.stdout.write(`${result.ndjson}\n`);
  }
}

async function showHelp() {
  const workbook = await loadWorkbook();
  const result = await workbook.help("worksheet.getRange");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function buildFilterBlock(sheetName) {
  return `FILTER('${sheetName}'!B8:G2821,(('${sheetName}'!B8:B2821<>\"\")+('${sheetName}'!C8:C2821<>\"\")+('${sheetName}'!D8:D2821<>\"\")+('${sheetName}'!E8:E2821<>\"\")+('${sheetName}'!F8:F2821<>\"\")+('${sheetName}'!G8:G2821<>\"\"))>0,\"\")`;
}

function buildSummaryFormula() {
  const stacked = subSheetNames.map((sheetName) => buildFilterBlock(sheetName)).join(",");
  return `=LET(data,VSTACK(${stacked}),clean,FILTER(data,INDEX(data,,1)<>\"\",\"\"),IFERROR(CHOOSE({1,2,3,4,5,6,7},SEQUENCE(ROWS(clean)),INDEX(clean,,1),INDEX(clean,,2),INDEX(clean,,3),INDEX(clean,,4),INDEX(clean,,5),INDEX(clean,,6)),\"\"))`;
}

async function writeSummaryFormula() {
  const workbook = await loadWorkbook();
  const totalSheet = workbook.worksheets.getItem("总表");
  const clearRange = totalSheet.getRange("A8:G2821");
  clearRange.values = Array.from({ length: 2814 }, () => Array(7).fill(null));
  totalSheet.getRange("A8").formulas = [[buildSummaryFormula()]];

  const check = await workbook.inspect({
    kind: "table",
    range: "总表!A7:G20",
    include: "values,formulas",
    tableMaxRows: 14,
    tableMaxCols: 7
  });
  process.stdout.write(`\n=== verify 总表!A7:G20 ===\n${check.ndjson}\n`);

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 100 },
    summary: "formula error scan"
  });
  process.stdout.write(`\n=== verify errors ===\n${errors.ndjson}\n`);

  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  process.stdout.write(`\nSAVED ${outputPath}\n`);
}

if (mode === "inspect") {
  await inspectWorkbook();
} else if (mode === "help") {
  await showHelp();
} else if (mode === "write") {
  await writeSummaryFormula();
} else {
  throw new Error(`Unsupported mode: ${mode}`);
}
