require("dotenv").config();
const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );

  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  if (!verify?.email) {
    return res.send("You are not authorized!");
  }
  req.user = verify.email;
  next();
}

const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersDB = client.db("usersDB");
    const cowsDB = client.db("cowsDB");
    const userCollection = usersDB.collection("userCollection");
    const cowsCollection = cowsDB.collection("cowsCollection");

    // user routes
    app.post("/user", async (req, res) => {
      const userData = req.body;
      if (!userData?.photoURL) {
        userData.photoURL = "";
      }
      userData.contactNumber = "";
      userData.address = "";
      userData.age = "";
      const token = createToken(userData);
      const isUserExists = await userCollection.findOne({
        email: userData.email,
      });

      if (isUserExists) {
        return res.send({
          status: "success",
          message: "Login success",
          token: token,
        });
      }
      await userCollection.insertOne(userData);
      res.send({ token });
    });
    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });
    app.patch("/user/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;

      const result = await userCollection.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    // cow's routes | 
    app.post("/cows", async (req, res) => {
      const cowsData = req.body;

      console.log(cowsData);
      const result = await cowsCollection.insertOne(cowsData);
      res.send(result);
    });
    app.get("/cows", async (req, res) => {
      const cowsData = cowsCollection.find();
      const result = await cowsData.toArray();
      res.send(result);
    });
    app.get("/cows/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cowsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.patch("/cows/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await cowsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });
    app.delete("/cows/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cowsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // reviews
     // cow's routes | 
     app.post("/reviews", async (req, res) => {
      const cowsData = req.body;

      console.log(cowsData);
      const result = await cowsCollection.insertOne(cowsData);
      res.send(result);
    });


    console.log("DB successfully connected!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("App is running!");
});

app.listen(port, () => {
  console.log("Server is running on port:", port);
});

// Testing