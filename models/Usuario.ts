import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  nombre: string;
  apellidos: string;
  email: string;
  password: String;
  creado: Date;
}

const UsuarioSchema: Schema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: { type: String, required: true, trim: true },
  creado: { type: Date, default: Date.now() },
});

export default mongoose.model<User>("Usuario", UsuarioSchema);
