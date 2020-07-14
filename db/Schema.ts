const { gql } = require("apollo-server");

const typeDefs = gql`
  scalar Date

  type Usuario {
    _id: ID
    nombre: String
    apellidos: String
    email: String
    creado: Date
  }
  type Token {
    token: String
  }

  type Producto {
    _id: ID
    nombre: String
    existencia: Int
    precio: Float
    creado: Date
  }

  type Cliente {
    _id: ID
    nombre: String
    apellidos: String
    email: String
    telefono: Int
    empresa: String
    vendedor: ID
  }

  type PedidoGrupo {
    _id: ID
    cantidad: Int
    nombre: String
    precio: Float
  }

  type Pedido {
    _id: ID
    pedido: [PedidoGrupo]
    cliente: Cliente
    vendedor: ID
    total: Float
    creado: Date
    estado: EstadoPedido
  }

  type TopCliente {
    total: Float
    cliente: [Cliente]
  }

  type TopVendedor {
    total: Float
    vendedor: [Usuario]
  }

  type Mensaje {
    mensaje: String!
  }

  type MensajeConfirmacion {
    mensaje: String!
  }

  input UsuarioInput {
    nombre: String!
    apellidos: String!
    email: String!
    password: String!
  }

  input ProductoInput {
    nombre: String!
    existencia: Int!
    precio: Float!
  }

  input ClienteInput {
    nombre: String!
    apellidos: String!
    email: String!
    empresa: String!
    telefono: Int
  }

  input PedidoProductoInput {
    _id: ID
    cantidad: Int
    nombre: String
    precio: Float
  }

  input PedidoInput {
    pedido: [PedidoProductoInput]
    estado: String
    cliente: ID!
    total: Float
  }

  enum EstadoPedido {
    PENDIENTE
    COMPLETADO
    CANCELADO
  }

  input AutenticarInput {
    email: String!
    password: String!
  }

  #Union Cliente
  union ObtenerCliente = Cliente | Mensaje

  #Union Producto
  union ObtenerProducto = Producto | Mensaje

  type Query {
    #Usuario
    obtenerUsuario: Usuario

    #Producto
    obtenerProductos: [Producto]
    obtenerProducto(id: ID!): ObtenerProducto

    #Cliente
    obtenerClientes: [Cliente]
    obtenerClientesVendedor: [Cliente]
    obtenerCliente(id: ID!): ObtenerCliente

    #Pedido
    obtenerPedidos: [Pedido]
    obtenerPedidosVendedor: [Pedido]
    obtenerPedido(id: ID!): Pedido
    obtenerPedidoEstado(estado: String!): [Pedido]

    #busqueda
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedor]
    busquedaProducto(texto: String): [Producto]
  }

  #Union Usuario
  union CrearUsuario = Usuario | Mensaje
  union AutenticarUsuario = Token | Mensaje

  #Union Producto
  union CrearProducto = Producto | Mensaje
  union ActualizarProducto = Producto | Mensaje
  union EliminarProducto = MensajeConfirmacion | Mensaje

  #Union Cliente
  union NuevoCliente = Cliente | Mensaje
  union ActualizarCliente = Cliente | Mensaje
  union EliminarCliente = MensajeConfirmacion | Mensaje

  #Union Pedido
  union NuevoPedido = Pedido | Mensaje
  union EliminarPedido = MensajeConfirmacion | Mensaje

  type Mutation {
    #Usuario
    nuevoUsuario(input: UsuarioInput!): CrearUsuario
    autenticarUsuario(input: AutenticarInput): AutenticarUsuario

    #Producto
    nuevoProducto(input: ProductoInput!): CrearProducto
    actualizarProducto(id: ID!, input: ProductoInput!): Producto
    eliminarProducto(id: ID!): EliminarProducto

    #Cliente
    nuevoCliente(input: ClienteInput!): NuevoCliente
    actualizarCliente(id: ID!, input: ClienteInput!): ActualizarCliente
    eliminarCliente(id: ID!): EliminarCliente

    #Pedido
    nuevoPedido(input: PedidoInput!): NuevoPedido
    actualizarPedido(id: ID!, input: PedidoInput!): Pedido
    eliminarPedido(id: ID!): EliminarPedido
  }
`;

export default typeDefs;
