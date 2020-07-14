const { ApolloServer } = require("apollo-server");
import typeDefs from "./db/Schema";
import resolvers from "./db/resolvers";
const conectarDB = require("./config/db");
const jwt = require("jsonwebtoken");

//server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: (response: { req: any }) => {
    const { req } = response;
    /*  console.log(req.headers["authorization"]);
     */
    let token: string = req.headers["authorization"] || "";

    /*  console.log(token); */

    if (token) {
      try {
        const usuario = jwt.verify(
          token.replace(`Bearer `, ""),
          process.env.SECRETA
        );
        console.log(usuario);
        return {
          usuario,
        };
      } catch (error) {
        console.log("Hubo un error");
        console.log(error);
      }
    }
  },
});

//conectar DB
conectarDB();

server.listen({port : process.env.PORT || 4000 }).then((response: { url: any }) => {
  console.log(`Servidor listo en la Url ${response.url}`);
});
