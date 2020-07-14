import mongoose, { Schema, Document } from "mongoose";
import { User } from "./Usuario";

export interface Client extends Document {
  nombre: String;
  apellidos: String;
  empresa: String;
  email: String;
  telefono?: Number;
  vendedor: User["_id"];
  creado: Date;
}

const ClienteSchema: Schema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellidos: {
    type: String,
    required: true,
    trim: true,
  },
  empresa: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  telefono: {
    type: Number,
    trim: true,
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

export default mongoose.model<Client>("Cliente", ClienteSchema);
