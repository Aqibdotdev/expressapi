import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Property = mongoose.model("Property", PropertySchema);
