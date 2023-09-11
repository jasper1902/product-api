import express, { Response, Request } from "express";
import * as fs from "fs/promises";
import path from "path";

const app = express();
app.use(express.json());

const filePath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "..", "data.json")
    : path.join(__dirname, "data.json");

interface Product {
  product: string;
  price: string;
  id: string;
}

let jsonData: { products: Product[] } = { products: [] };

async function readDataFile() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    jsonData = JSON.parse(data);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
    } else {
      console.error(error);
    }
  }
}

readDataFile();

app.get("/products", (request: Request, response: Response) => {
  response.status(200).json(jsonData.products);
});

app.post("/products", async (request: Request, response: Response) => {
  try {
    const { product, price } = request.body;
    const lastProductId =
      jsonData.products.length > 0
        ? jsonData.products[jsonData.products.length - 1].id
        : "0";
    const id = String(parseInt(lastProductId) + 1);

    const newProduct = { product, price, id };
    jsonData.products.push(newProduct);

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

    response
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/products/:id", async (request: Request, response: Response) => {
  try {
    const productId = request.params.id;
    const productIndex = jsonData.products.findIndex(
      (product) => product.id === productId
    );
    console.log(productId);
    if (productIndex === -1) {
      return response.status(404).json({ error: "Product not found" });
    }

    jsonData.products.splice(productIndex, 1);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

    response.status(200).json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5001, () => console.log("listening on port 5001"));
