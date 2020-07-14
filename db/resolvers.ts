import Usuario, { User } from "../models/Usuario";
import Producto, { Product } from "../models/Producto";
import { ApolloError } from "apollo-server";
import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import Cliente, { Client } from "../models/Cliente";
import Pedido, { Order } from "../models/Pedido";
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* require("dotenv").config({ path: "variables.env" }); */

const resolvers = {
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
  Query: {
    obtenerUsuario: async (_: any, {}, ctx: { usuario: User }) => {
      try {
        const { usuario } = ctx;
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerProductos: async (): Promise<Product[] | undefined> => {
      try {
        const productos: Array<Product> = await Producto.find({});
        console.log(productos);

        return productos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerProducto: async (_: any, args: { id: String }) => {
      try {
        const { id } = args;
        const producto = await Producto.findById({ _id: id });
        if (!producto) {
          /*  throw new ApolloError("El Producto no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El producto no existe",
          };
        }
        return {
          __typename: "Producto",
          _id: producto._id,
          nombre: producto.nombre,
          existencia: producto.existencia,
          precio: producto.precio,
        };
      } catch (error) {
        console.log(error);
      }
    },
    obtenerClientes: async (): Promise<Array<Client> | undefined> => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerClientesVendedor: async (_: any, {}, ctx: { usuario: User }) => {
      try {
        const { usuario } = ctx;

        const existeVendedor = await Usuario.findById(usuario._id);

        if (!existeVendedor) {
          throw new Error("El vendedor no existe");
        }

        const clientesVendedor = await Cliente.find({ vendedor: usuario._id });
        if (clientesVendedor.length < 1) {
          throw new Error("El vendedor no tiene clientes");
        }
        return clientesVendedor;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerCliente: async (
      _: any,
      args: { id: String },
      ctx: { usuario: User }
    ) => {
      try {
        const { id } = args;
        const { usuario } = ctx;

        //verificar si existe
        const cliente = await Cliente.findById(id);
        if (!cliente) {
          /* throw new Error("El cliente no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El cliente no existe",
          };
        }

        //quien lo creo puede verlo
        if (cliente.vendedor.toString() !== usuario._id) {
          /*  throw new Error("No se puede acceder a un cliente de otro vendedor "); */
          return {
            __typename: "Mensaje",
            mensaje: "No se puede acceder a un cliente de otro vendedor",
          };
        }

        return {
          __typename: "Cliente",
          _id: cliente._id,
          nombre: cliente.nombre,
          apellidos: cliente.apellidos,
          empresa: cliente.empresa,
          email: cliente.email,
          telefono: cliente.telefono,
          vendedor: cliente.vendedor,
          creado: cliente.creado,
        };
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidosVendedor: async (_: any, {}, ctx: { usuario: User }) => {
      try {
        const { usuario } = ctx;

        const pedidos = await Pedido.find({ vendedor: usuario._id })
          .sort({ _id: -1 })
          .populate("cliente");

        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedido: async (
      _: any,
      args: { id: String },
      ctx: { usuario: User }
    ) => {
      try {
        const { id } = args;
        const { usuario } = ctx;

        const pedido = await Pedido.findById({ _id: id });
        if (!pedido) {
          throw new Error("El pedido no existe");
        }

        if (pedido.vendedor.toString() !== usuario._id) {
          throw new Error("No tienes las credenciales");
        }

        return pedido;
      } catch (error) {
        console.log(error);
      }
    },
    obtenerPedidoEstado: async (
      _: any,
      args: { estado: String },
      ctx: { usuario: User }
    ) => {
      try {
        const { estado } = args;
        const { usuario } = ctx;
        const pedido = await Pedido.find({
          estado: estado,
          vendedor: usuario._id,
        });

        return pedido;
      } catch (error) {
        console.log(error);
      }
    },
    mejoresClientes: async () => {
      try {
        const cliente = await Pedido.aggregate([
          { $match: { estado: "COMPLETADO" } },
          { $group: { _id: "$cliente", total: { $sum: "$total" } } },
          {
            $lookup: {
              from: "clientes",
              localField: "_id",
              foreignField: "_id",
              as: "cliente",
            },
          },
          {
            $sort: { total: -1 },
          },
        ]);
        return cliente;
      } catch (error) {
        console.log(error);
      }
    },
    mejoresVendedores: async () => {
      try {
        const vendedor = await Pedido.aggregate([
          { $match: { estado: "COMPLETADO" } },
          { $group: { _id: "$vendedor", total: { $sum: "$total" } } },
          {
            $lookup: {
              from: "usuarios",
              localField: "_id",
              foreignField: "_id",
              as: "vendedor",
            },
          },
          {
            $sort: { total: -1 },
          },
        ]);
        return vendedor;
      } catch (error) {
        console.log(error);
      }
    },
    busquedaProducto: async (_: any, args: { texto: string }) => {
      try {
        const { texto } = args;

        const producto = await Producto.find({ $text: { $search: texto } });

        return producto;
      } catch (error) {
        console.log(error);
      }
    },
  },
  Mutation: {
    nuevoUsuario: async (
      _: any,
      args: { input: User }
    ): Promise<User | any> => {
      try {
        //Revisar si el usuario esta registrado
        const { input } = args;
        const { email, password } = input;

        const existeUsuario = await Usuario.findOne({ email });
        /* console.log(context.input); */
        if (existeUsuario) {
          /*  throw new ApolloError("El usuario existe"); */

          return {
            __typename: "Mensaje",
            mensaje: `El usuario existe`,
          };
        }

        // hashear password
        const salt: number = await bcryptjs.genSalt(10);
        /* console.log(salt); */
        input.password = String(await bcryptjs.hash(password, salt));

        //guardar base datos

        const usuario = /* await */ new Usuario(input);
        usuario.save();
        /* console.log(usuario); */
        return {
          __typename: "Usuario",
          _id: usuario._id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          creado: usuario.creado,
          email: usuario.email,
        };
        /*  console.log(req.input); */
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (
      _: any,
      args: { input: User }
    ): Promise<any | undefined> => {
      try {
        const { input } = args;
        const { email, password } = input;

        //verificar usuario existe

        const usuarioExiste = await Usuario.findOne({ email });

        if (!usuarioExiste) {
          /*  throw new Error("El usuario no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El usuario no existe",
          };
        }

        //revisar password correcto

        const passwordCorrecto: boolean = await bcryptjs.compare(
          password,
          usuarioExiste.password
        );
        if (!passwordCorrecto) {
          /* throw new Error("El password es incorrecto"); */
          return {
            __typename: "Mensaje",
            mensaje: "El password es incorrecto",
          };
        }

        //token

        return {
          __typename: "Token",
          token: crearToken(usuarioExiste, process.env.SECRETA, "24h"),
        };
      } catch (error) {
        console.log(error);
      }
    },
    nuevoProducto: async (_: any, args: { input: Product }) => {
      try {
        const { input } = args;

        const existeProducto = await Producto.findOne({ nombre: input.nombre });
        console.log(existeProducto);

        if (existeProducto) {
          return {
            __typename: "Mensaje",
            mensaje: "El producto existe",
          };
        }

        const nuevoProducto = new Producto(input);
        nuevoProducto.save();
        return {
          __typename: "Producto",
          nombre: nuevoProducto.nombre,
          existencia: nuevoProducto.existencia,
          precio: nuevoProducto.precio,
          creado: nuevoProducto.creado,
        };
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProducto: async (
      _: any,
      args: { id: string; input: Product }
    ): Promise<any | Error> => {
      try {
        const { id, input } = args;
        let producto = await Producto.findById(id);
        console.log(producto);

        if (!producto) {
          throw new ApolloError("El producto no existe");
        }

        producto = await Producto.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });

        return producto;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarProducto: async (_: any, args: { id: string }) => {
      try {
        const { id } = args;

        const existeProducto = await Producto.findById(id);

        if (!existeProducto) {
          /* throw new Error("El producto no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El producto no existe",
          };
        }

        await Producto.findOneAndDelete({ _id: id });
        /*  return "Producto eliminado"; */
        return {
          __typename: "MensajeConfirmacion",
          mensaje: "Producto eliminado",
        };
      } catch (error) {
        console.log(error);
      }
    },
    nuevoCliente: async (
      _: any,
      args: { input: Client },
      ctx: { usuario: User }
    ) /* : Promise<Client | undefined> */ => {
      try {
        const { input } = args;
        const { email } = input;
        const { usuario } = ctx;
        console.log(usuario);

        const existeCliente = await Cliente.findOne({ email });

        if (existeCliente) {
          /* throw new Error("El cliente existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El cliente existe",
          };
        }

        const nuevoCliente = new Cliente(input);

        nuevoCliente.vendedor = usuario._id;

        nuevoCliente.save();

        return {
          __typename: "Cliente",
          _id: nuevoCliente?._id,
          nombre: nuevoCliente?.nombre,
          apellidos: nuevoCliente?.apellidos,
          email: nuevoCliente?.email,
          telefono: nuevoCliente?.telefono,
          empresa: nuevoCliente?.empresa,
          vendedor: nuevoCliente?.vendedor,
          creado: nuevoCliente?.creado,
        };
      } catch (error) {
        console.log(error);
      }
    },
    actualizarCliente: async (
      _: any,
      args: { id: string; input: Client },
      ctx: { usuario: User }
    ) => {
      try {
        const { id, input } = args;
        const { usuario } = ctx;
        let cliente = await Cliente.findById(id);
        if (!cliente) {
          /* throw new Error("El cliente no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El cliente no existe",
          };
        }

        if (cliente.vendedor.toString() !== usuario._id) {
          /* throw new Error("No tienes las credenciales"); */
          return {
            __typename: "Mensaje",
            mensaje: "No tienes las credenciales",
          };
        }
        cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return {
          __typename: "Cliente",
          _id: cliente?._id,
          nombre: cliente?.nombre,
          apellidos: cliente?.apellidos,
          email: cliente?.email,
          telefono: cliente?.telefono,
          empresa: cliente?.empresa,
          vendedor: cliente?.vendedor,
          creado: cliente?.creado,
        };
      } catch (error) {
        console.log(error);
        /* console.log("Hubo un error"); */
        return { __typename: "Mensaje", mensaje: "Hubo un error" };
      }
    },
    eliminarCliente: async (
      _: any,
      args: { id: string },
      ctx: { usuario: User }
    ) => {
      try {
        const { id } = args;
        const { usuario } = ctx;
        console.log(id);

        const cliente = await Cliente.findById(id);
        if (!cliente) {
          /* throw new Error("El cliente no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El cliente no existe",
          };
        }

        if (cliente.vendedor.toString() !== usuario._id) {
          /* throw new Error("No tienes las credenciales"); */
          return {
            __typename: "Mensaje",
            mensaje: "No tienes las credenciales",
          };
        }

        await Cliente.findOneAndDelete({ _id: id });
        /* return "Cliente Eliminado"; */
        return {
          __typename: "MensajeConfirmacion",
          mensaje: "Cliente Eliminado correctamente",
        };
      } catch (error) {
        console.log(error);
        /*  console.log('error'); */
      }
    },
    nuevoPedido: async (
      _: any,
      args: { input: Order },
      ctx: { usuario: User }
    ) => {
      try {
        const { input } = args;
        const { usuario } = ctx;

        const existeCliente = await Cliente.findById(input.cliente);

        if (!existeCliente) {
          /*  throw new Error("El cliente no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El cliente no existe",
          };
        }

        //verificar si el cliente es del vendedor

        if (existeCliente.vendedor.toString() !== usuario._id) {
          /* throw new Error("No tienes las credenciales"); */
          return {
            __typename: "Mensaje",
            mensaje: "No tienes las credenciales",
          };
        }

        //verificar stock

        for await (const articulo of input.pedido) {
          console.log(articulo);

          const { _id } = articulo;
          const producto: any = await Producto.findById(_id);
          console.log(producto);

          if (articulo.cantidad > producto?.existencia) {
            /* console.log(articulo);
            console.log(producto); */
            /*  throw new Error(
              `El articulo ${producto?.nombre} excede la cantidad disponible : acticulo : ${articulo.cantidad} > cantidad : ${producto?.existencia}`
            ); */
            return {
              __typename: "Mensaje",
              mensaje: `El articulo ${producto?.nombre} excede la cantidad disponible : acticulo : ${articulo.cantidad} > cantidad : ${producto?.existencia}`,
            };
          } else {
            //restar la cantidad a lo disponible
            producto.existencia =
              Number(producto.existencia) - Number(articulo.cantidad);
            await producto.save();
          }
        }

        const pedido = new Pedido(input);

        pedido.vendedor = usuario._id;

        await pedido.save();
        /* return pedido; */
        return {
          __typename: "Pedido",
          _id: pedido._id,
          pedido: pedido.pedido,
          total: pedido.total,
          estado: pedido.estado,
          cliente: pedido.cliente,
          vendedor: pedido.vendedor,
          creado: pedido.creado,
        };
      } catch (error) {
        console.log(error);
      }
    },
    actualizarPedido: async (
      _: any,
      args: { input: Order; id: String },
      ctx: { usuario: User }
    ) => {
      try {
        const { id, input } = args;
        const { usuario } = ctx;
        console.log(id);
        console.log(input);

        let pedido = await Pedido.findById(id);

        if (!pedido) {
          throw new Error("El pedido no existe");
        }

        const cliente = await Cliente.findById(input.cliente);

        if (!cliente) {
          throw new Error("El cliente no existe");
        }

        if (pedido.vendedor.toString() !== usuario._id) {
          throw new Error("No tienes las credenciales");
        }

        for await (const articulo of pedido.pedido) {
          const { id } = articulo;
          const producto: any = await Producto.findById(id);

          if (input.pedido) {
            if (articulo.cantidad > producto?.existencia) {
              throw new Error(
                `El articulo ${producto?.nombre} excede la cantidad disponible : acticulo : ${articulo.cantidad} > cantidad : ${producto?.existencia}`
              );
            } else {
              producto.existencia =
                Number(producto.existencia) - Number(articulo.cantidad);
              await producto.save();
            }
          }
        }

        pedido = await Pedido.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });

        return pedido;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarPedido: async (
      _: any,
      args: { id: String },
      ctx: { usuario: User }
    ) => {
      try {
        const { id } = args;
        const { usuario } = ctx;

        const pedido = await Pedido.findById(id);

        if (!pedido) {
          /*  throw new Error("El pedido no existe"); */
          return {
            __typename: "Mensaje",
            mensaje: "El pedido no existe",
          };
        }

        if (pedido.vendedor.toString() !== usuario._id) {
          /* throw new Error("No tienes las credenciales"); */
          return {
            __typename: "Mensaje",
            mensaje: "No tienes las credenciales",
          };
        }

        await Pedido.findByIdAndDelete({ _id: id });
        /* return "Pedido Eliminado"; */
        return {
          __typename: "MensajeConfirmacion",
          mensaje: "Pedido Eliminado",
        };
      } catch (error) {
        console.log(error);
      }
    },
  },
};

const crearToken = (usuario: User, secreta: any, expiresIn: string): any => {
  /*  console.log(usuario);
  console.log(secreta); */
  const { _id, email, password, nombre, apellidos } = usuario;
  /* console.log(usuario); */

  return jwt.sign({ _id, nombre, apellidos, email }, secreta, { expiresIn });
};

export default resolvers;
