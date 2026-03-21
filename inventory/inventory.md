# MongoDB Guide: From Databases to Collections (Tables)

MongoDB is a NoSQL, document-oriented database. Unlike traditional SQL databases, it stores data in flexible, JSON-like documents. 

## SQL vs MongoDB Terminology
If you are coming from a relational database background (like MySQL or PostgreSQL), here is how the concepts map out:

| SQL (Relational) | MongoDB (NoSQL) |
|------------------|-----------------|
| Database         | Database        |
| Table            | Collection      |
| Row              | Document        |
| Column           | Field           |
| Joins            | `$lookup` / Embedding |

---

## 1. Connecting to MongoDB
You can connect to MongoDB locally or via the cloud (MongoDB Atlas). This is typically done using the MongoDB Shell (`mongosh`), MongoDB Compass (a visual GUI), or directly inside your application code via a driver (like Mongoose for Node.js).

Using the shell to connect to a local database:
```bash
mongosh "mongodb://localhost:27017"
```

## 2. Creating / Selecting a Database
In MongoDB, you don't explicitly run a "CREATE DATABASE" command. You simply tell MongoDB which database you want to use. If it doesn't exist, MongoDB will create it dynamically the first time you save data.

```javascript
// Switch to a new or existing database
use inventory_db
```
*Note: The database won't actually be saved to disk until you insert the first document into it.*

## 3. Creating a "Table" (Collection)
Similar to databases, collections can be created implicitly simply by inserting your first record (document). However, you can also create them explicitly if you want to set specific configuration options.

**Implicit Creation (Recommended / Most Common):**
```javascript
// This creates the "products" collection automatically and inserts the document.
db.products.insertOne({ name: "Laptop", price: 1200, stock: 45 })
```

**Explicit Creation:**
```javascript
// Manually creating a collection (Useful if you want to define strict schema validation rules directly in the DB)
db.createCollection("products")
```

---

## 4. Basic CRUD Operations in MongoDB Shell

### Create (Insert Data)
Insert a single document:
```javascript
db.products.insertOne({
  name: "Wireless Mouse",
  category: "Electronics",
  price: 25.99,
  stock: 150
})
```

Insert multiple documents at once:
```javascript
db.products.insertMany([
  { name: "Mechanical Keyboard", price: 45.00, stock: 80 },
  { name: "HD Monitor", price: 199.99, stock: 30 }
])
```

### Read (Select Data)
Get all documents in the collection (equivalent to `SELECT * FROM products`):
```javascript
db.products.find()
```
*Tip: Attach `.pretty()` at the end if you are using an older version of the Mongo shell to format the output nicely.*

Find with a condition (equivalent to `SELECT * FROM products WHERE category = 'Electronics'`):
```javascript
db.products.find({ category: "Electronics" })
```

Find one specific document (returns just the object, rather than a cursor/list):
```javascript
db.products.findOne({ name: "Laptop" })
```

### Update Data
Update a single document:
```javascript
// Syntax: db.collection.updateOne(filter, updateAction)
db.products.updateOne(
  { name: "Wireless Mouse" }, // 1. Find the item
  { $set: { price: 22.99, stock: 140 } } // 2. Perform the update using $set
)
```

Update multiple documents:
```javascript
// Increase price of all items in "Electronics" category by exactly $10
db.products.updateMany(
  { category: "Electronics" },
  { $inc: { price: 10 } } // $inc increments the value
)
```

### Delete Data
Delete a single document:
```javascript
db.products.deleteOne({ name: "HD Monitor" })
```

Delete multiple documents:
```javascript
// Delete all products that have 0 stock
db.products.deleteMany({ stock: 0 })
```

---

## 5. Using MongoDB in a Node.js App (Mongoose)
For an application (like your `inventory` microservice), you'll likely use **Mongoose** to interact with MongoDB. Mongoose allows you to define strict schemas (similar to defining columns in SQL tables).

### Step A: Define a Schema and Model (The "Table" Definition)
```javascript
const mongoose = require('mongoose');

// 1. Define the Schema (Structure of your Document)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "General" },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// 2. Create the Model (This behaves as the Collection)
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
```

### Step B: Database Operations in your Controllers
```javascript
const Product = require('./models/Product');

// 1. Create
const createProduct = async () => {
  const newProduct = await Product.create({ name: "Webcam", price: 50, stock: 10 });
  console.log("Inserted:", newProduct);
};

// 2. Read
const getProducts = async () => {
  const products = await Product.find({ category: "General" });
  console.log("Products found:", products);
};

// 3. Update
const updateProduct = async (id) => {
  // Finds item by ID and updates it, returning the newly updated document
  const updatedProduct = await Product.findByIdAndUpdate(
    id, 
    { $set: { stock: 15 } }, 
    { new: true } 
  );
};

// 4. Delete
const deleteProduct = async (id) => {
  await Product.findByIdAndDelete(id);
};
```
