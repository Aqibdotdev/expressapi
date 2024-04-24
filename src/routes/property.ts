import express from "express";
import { Property } from "../models/property";

import authenticateToken from "../middlewares/authenticateToken";
import { error } from "console";
import { connect } from "http2";
import redisClient from "../connections/redisConnect";
import { logAnalytics } from "../helpers/analyticsHelpers";
const router = express.Router();

router.use("/", authenticateToken);

// Propety Post create
router.post("/create", async (req, res) => {
  try {
    // @ts-ignore
    const body = { ...req.body, createdBy: req.createdBy };
    const property = await Property.create(body);

    res.status(200).json(property);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get property
router.get("/", async (req: any, res) => {
  try {
    const property = await Property.find({
      createdBy: req.createdBy,
    });

    res.status(200).json(property);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Read all Peoperties
router.get("/all", async (req: any, res) => {
  try {
    await logAnalytics("allProperties", req.createdBy);

    const queryParams = req.query;
    console.log(queryParams);
    const minPrice = Number(queryParams.minPrice) || 0;
    const maxPrice = Number(queryParams.maxPrice);
    // const { minPrice, maxPrice } = queryParams;

    if (minPrice > maxPrice) {
      return res.status(400).json({
        message: "Mininum price can not be greater than maximum price",
      });
    }

    // pagination
    const pageSize = req.query.pageSize;
    const pageNum = req.query.pageNum;
    console.log({ pageSize, pageNum });

    const lastIndex = pageSize * pageNum;
    const firstIndex = lastIndex - pageSize;

    // checking if redis has properties
    let redisKey = `allProperties`;
    if (minPrice && maxPrice) {
      redisKey = redisKey.concat(`-${minPrice}-${maxPrice}`);
    }
    if (pageNum && pageSize) {
      redisKey = redisKey.concat(`-${pageNum}-${pageSize}`);
    }

    console.log({ redisKey });

    const cachedProperties = await redisClient.get(redisKey);

    // if properties are in cache return them.
    if (cachedProperties) {
      return res.status(200).json({
        message: "From Cache",
        data: JSON.parse(cachedProperties),
      });
    }
    // https://postman-rest-api-learner.glitch.me/
    // if properties are not in cache then proceed to db
    const query = maxPrice
      ? { price: { $gte: minPrice, $lte: maxPrice } }
      : {
          price: { $gte: minPrice },
        };

    const property = await Property.find(query)
      .sort({ price: -1 })
      .skip(firstIndex)
      .limit(pageSize);
    // cache the properties reterived from db

    await redisClient.set(redisKey, JSON.stringify(property), {
      EX: 60,
    });

    res.status(200).json({
      message: "From DB",
      data: property,
    });
  } catch (error: any) {
    console.log({ error });
    res.status(500).json({ message: error.message });
  }
});

// Read 1 property by id
router.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;

    logAnalytics("property-" + id, req.createdBy);

    // Checking redis cache for property
    const cachedProperty = await redisClient.get(
      `property-${id}-${req.createdBy}`
    );

    if (cachedProperty) {
      // if property is in redis return it directly
      return res.status(200).json(JSON.parse(cachedProperty));
    }

    const propertyFromDB = await Property.findById(id);
    const propertyCreatedBy = propertyFromDB?.createdBy;

    if (propertyCreatedBy !== req.createdBy) {
      res.status(401).json("Not authorized to read this property");
      return;
    }

    const property = await Property.findById(id);
    await redisClient.set(
      `property-${id}-${req.createdBy}`,
      JSON.stringify(property),
      {
        EX: 60,
      }
    );
    res.status(200).json(property);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete
router.delete("/:id", async (req: any, res) => {
  try {
    const id = req.params.id;

    const propertyFromDB = await Property.findById(id);
    const propertyCreatedBy = propertyFromDB?.createdBy;

    console.log(
      "Created by from Token: ",
      req.createdBy,
      "Created by from DB: ",
      propertyCreatedBy
    );
    if (propertyCreatedBy) {
      if (propertyCreatedBy !== req.createdBy) {
        res.status(401).json("You are not authorized to delete this property");
        return;
      }
    }

    const data = await Property.findByIdAndDelete(id);
    console.log(data + " data");

    if (data) {
      res
        .status(200)
        .json(`Document createdBy ${data?.createdBy} has been delated.`);
    } else {
      res.status(401).json("Document not found!");
    }
    // Deleting from Redis
    // const redisKeyToDelete = `property-${id}-${propertyCreatedBy}`;

    // redisClient.del(redisKeyToDelete, (err: any, result: any) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     if (result === 1) {
    //       console.log(`Redis Key ${redisKeyToDelete} deleted `);
    //     } else {
    //       console.log(`Redis Key ${redisKeyToDelete} not found`);
    //     }
    //   }
    // });
    // Another way of deleting redis keys using pattern matching
    const constantValue = "property-";
    const wildcardPattern = "*";

    redisClient.keys(
      constantValue + wildcardPattern,
      (err: any, keys: any[]) => {
        if (err) throw err;

        keys.forEach((key: any) => {
          redisClient.del(key);
          console.log(key);
        });
      }
    );
    // / / / / / / / / /
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update
router.put("/update/:id", async (req: any, res) => {
  const id = req.params.id;

  const propertyFromDB = await Property.findById(id);
  const propertyCreatedBy = propertyFromDB?.createdBy;

  console.log(
    "Created by from Token: ",
    // @ts-ignore
    req.createdBy,
    "Created by from DB: ",
    propertyCreatedBy
  );

  if (propertyCreatedBy !== req.createdBy) {
    res.status(401).json("Not authorized to update this property");
    return;
  }

  const data = await Property.findByIdAndUpdate(id, req.body);
  console.log(data + " data");

  if (!data) {
    return res.status(404).json({ message: "property not found" });
  }

  const updatedProperty = await Property.findById(id);
  console.log(updatedProperty + " updated Prop");

  res.status(200).json(updatedProperty);
});

//Archive
router.put("/archive", async (req: any, res) => {
  try {
    const { _id } = req.body; //const _id = req.body._id;

    const propertyFromDB = await Property.findById(_id);
    const propertyCreatedBy = propertyFromDB?.createdBy;

    console.log({ propertyCreatedBy, fromHeaderCreatedBy: req.createdBy });

    if (propertyCreatedBy?.toLowerCase() !== req.createdBy?.toLowerCase()) {
      res.status(401).json("Not authorized to archive this property");
      return;
    }

    const property = await Property.findById(_id);

    if (!property) {
      res.status(404).json({ message: "Property not found" });
    }

    if (property) {
      property.archived = true;
      property.archivedAt = new Date();

      await property?.save();
      res.status(200).json({ message: "property archived successfully" });

      // Deleting from Redis
      const redisKeyToDelete = `property-${_id}-${req.createdBy}`;

      console.log({ redisKeyToDelete });

      redisClient.del(redisKeyToDelete, (err: any, result: any) => {
        if (err) {
          console.log(err);
        } else {
          if (result === 1) {
            console.log(`Redis Key ${redisKeyToDelete} deleted `);
          } else {
            console.log(`Redis Key ${redisKeyToDelete} not found`);
          }
        }
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "error archiving!" });
  }
});

module.exports = router;
