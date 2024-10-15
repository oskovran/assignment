import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

interface CountryBoundry {
  id: string;
  code: string;
  name: string;
  area: "mainland" | "island" | undefined;
  maxLat: number;
  minLat: number;
  coordinates: number[][];
}

const csvFilePath = path.resolve(__dirname, "files/country-borders.csv");
const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

const boundries: CountryBoundry[] = [];

const parser = parse({
  delimiter: ",",
});

parser.write(fileContent);
parser.end();

// Parse the data
parser.on("readable", () => {
  let record: string[] | null;

  while ((record = parser.read())) {
    const [id, code, name, coordinates] = record;

    // Split and parse coordinates
    const coords: number[][] = coordinates.split(":").map((coord) => {
      return coord.split(" ").map(Number);
    });

    let maxLat = 90;
    let minLat = -90;

    if (coords.length > 0) {
      maxLat = Math.max(...coords.map((coord) => coord[1]));
      minLat = Math.min(...coords.map((coord) => coord[1]));
    }

    // Output the structured data
    boundries.push({
      id,
      code,
      name,
      area: undefined,
      maxLat,
      minLat,
      coordinates: coords,
    });
  }
});

// Process the parsed data
parser.on("end", () => {
  for (const boundry of boundries) {
    if (boundry.area === undefined) {
      const boundryMaxLat = boundry.maxLat;
      const boundryMinLat = boundry.minLat;

      boundry.area = "island";

      for (let i = boundries.length - 1; i >= 0; i--) {
        const boundry2 = boundries[i];
        const boundry2MaxLat = boundry2.maxLat;
        const boundry2MinLat = boundry2.minLat;

        if (
          boundry2.area !== "island" &&
          boundry !== boundry2 &&
          boundryMinLat <= boundry2MaxLat &&
          boundryMaxLat >= boundry2MinLat
        ) {
          if (
            boundry.coordinates.find(
              (coord1) =>
                coord1[1] >= boundry2MinLat &&
                coord1[1] <= boundry2MaxLat &&
                boundry2.coordinates.find(
                  (coord2) => coord1[0] === coord2[0] && coord1[1] === coord2[1]
                )
            )
          ) {
            boundry.area = "mainland";
            boundry2.area = "mainland";
            break;
          }
        }
      }
    }

    if (boundry.area === "mainland") {
      console.log(boundry.id);
    }
  }
});
