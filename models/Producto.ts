import mongoose, { Schema, Document } from "mongoose";

export interface Product extends Document {
  nombre: string;
  existencia: number;
  precio: number;
  creado: Date;
}

const ProductoSchema: Schema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  existencia: {
    type: Number,
    required: true,
    trim: true,
  },
  precio: {
    type: Number,
    required: true,
    trim: true,
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

ProductoSchema.index({ nombre: "text" });

export default mongoose.model<Product>("Producto", ProductoSchema);
