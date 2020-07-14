import mongoose, { Schema, Document } from "mongoose";
import { User } from "./Usuario";
import { Client } from "./Cliente";
import { Product } from "./Producto";

export interface Order extends Document {
  pedido: Array<ProductOrder>;
  total: number;
  estado: String;
  cliente: Client["_id"];
  vendedor: User["_id"];
  creado: Date;
}

export interface ProductOrder extends Document {
  _id: Product["_id"];
  cantidad: Number;
  nombre: string;
  precio: number;
}

const PedidoSchema: Schema = new mongoose.Schema({
  pedido: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    default: "PENDIENTE",
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Cliente",
  },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Usuario",
  },
  creado: {
    type: Date,
    default: Date.now(),
  },
});

export default mongoose.model<Order>("Pedido", PedidoSchema);
