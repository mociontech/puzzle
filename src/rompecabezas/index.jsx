import "./styles.css";
import "react-jigsaw-puzzle/lib/jigsaw-puzzle.css";
import { useState, useEffect } from "react";
import { JigsawPuzzle } from "react-jigsaw-puzzle/lib";
import { useRef } from "react";
import { setNewUser } from "../db/firebase";

let interval = null;
let timeout = null;
const tiempo = 7;
let contador = 0;

const validEmailRegex = RegExp(
  /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);

export default function index() {
  const [image, setImage] = useState(null);
  const [tab, setTab] = useState(1);
  const [show, setShow] = useState(false);
  const [win, setWin] = useState(false);
  const [premio, setPremio] = useState(false);
  const [counter, setCounter] = useState(tiempo);
  const [productos, setProductos] = useState({});

  const form = useRef();

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("productos"));
    items && setProductos(items);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      localStorage.setItem("productos", JSON.stringify(productos));
    }, 1000);
  }, [productos]);

  useEffect(() => {
    if (win || counter <= 0) {
      clearInterval(interval);
      sortearPremios();
      setTab(3);
    }
  }, [counter, win]);

  const showCMS = () => {
    timeout && clearTimeout(timeout);
    contador++;
    timeout = setTimeout(() => (contador = 0), 1000);
    contador >= 6 && setShow(true);
  };

  const iniciar = () => {
    if (image === null) {
      alert("Elije una imagen");
    } else {
      setTab(2);
      interval = setInterval(
        () => setCounter((old) => (counter > 0 ? old - 1 : 0)),
        1000
      );
    }
  };

  const registrar = (user) => {
    const items = JSON.parse(localStorage.getItem("usuarios")) || [];
    items.push(user);
    localStorage.setItem("usuarios", JSON.stringify(items));
  };

  const comprobar = () => {
    const fields = ["nombre", "telefono", "correo"];
    const user = {};
    user.fecha = new Date().toString();
    fields.forEach((name) => (user[name] = form.current[name].value));
    if (validEmailRegex.test(user.correo)) {
      registrar(user);
      setTab(1);
    } else {
      alert(`Correo ${user.correo} no es válido`);
    }
  };

  const restart = () => {
    setImage(null);
    setTab(1);
    setWin(false);
    setCounter(tiempo);
  };

  const guardarPremios = (e) => {
    e.preventDefault();
    const producto = e.target.producto.value;
    const cantidad = e.target.cantidad.value;
    if (producto && cantidad) {
      setProductos((old) => ({ ...old, [producto]: cantidad }));
      e.target.producto.value = "";
      e.target.cantidad.value = "";
    }
  };

  const sortearPremios = () => {
    setProductos((old) => {
      const copy = { ...old };
      const items = {};
      Object.keys(copy).forEach((k) => k !== "Pola" && items);
      const premios = Object.keys(copy);
      const perdiste = [];
      premios.forEach((k) => k !== "Pola" && perdiste.push(k));
      const keys = win ? premios : perdiste;
      console.log(keys);
      if (keys.length > 0) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        parseInt(copy[key]) <= 1 ? delete copy[key] : (copy[key] -= 1);
        setPremio(key);
      }
      return copy;
    });
  };

  const borrarPremio = (key) =>
    setProductos((old) => {
      const copy = { ...old };
      delete copy[key];
      return copy;
    });

  const sendToFirebase = () => {
    const items = JSON.parse(localStorage.getItem("usuarios")) || [];
    console.log(items);
    items.forEach((user) => setNewUser("DBBancoBogota", user, user.correo));
    localStorage.setItem("usuarios", JSON.stringify([]));
    alert("Datos enviados a la base de datos");
  };

  const text = win
    ? "¡FELICITACIONES! Ganaste: "
    : "¿Se te acabó el tiempo? No te preocupes, por participar ganaste: ";

  return (
    <div className="romecabezas vertical center" style={{ gap: 15 }}>
      {/* CMS */}
      <div
        className={show ? "inventario" : "inv_oculto"}
        style={{ margin: 10 }}
      >
        <form onSubmit={guardarPremios}>
          <input name="producto" type="text" placeholder="Producto" />
          <br />
          <input name="cantidad" type="number" placeholder="Cantidad" />
          <br />
          <input type="submit" value="Actualizar" />
        </form>
        {Object.keys(productos).map((name, k) => (
          <div
            key={k}
            style={{
              margin: "10px 0",
              border: "1px black solid",
              textAlign: "center",
            }}
          >
            <span>
              {productos[name]} {name}
            </span>
            &nbsp;&nbsp;&nbsp;
            <button onClick={() => borrarPremio(name)}>Borrar</button>
          </div>
        ))}
        {premio ? <div>Ganaste {premio}!</div> : null}
        <button onClick={() => setShow(false)}>Cerrar</button>
        <button onClick={sendToFirebase}>Enviar usuarios</button>
      </div>

      {/* Ventana de registro */}
      {tab === 0 ? (
        <>
          <h1 onClick={showCMS}>Registrate para participar</h1>
          <form ref={form} className="vertical">
            <span>
              NOMBRE: <input name="nombre" type="text" />
            </span>
            <span>
              TELÉFONO: <input name="telefono" type="text" />
            </span>
            <span>
              CORREO: <input name="correo" type="text" />
            </span>
          </form>
          <div className="button" onClick={comprobar}>
            Siguiente
          </div>
        </>
      ) : null}

      {/* Ventana de selección */}
      {tab > 0 && tab < 3 ? (
        <p>Resuelve el puzzle en menos de {counter} segundos</p>
      ) : null}
      {tab === 1 ? (
        <>
          <h1 onClick={showCMS}>Selecciona una imágen</h1>
          <div className="flex elegir">
            {[...Array(4).keys()].map((k) => (
              <img
                className={image === k ? "seleccionada" : "no_seleccionada"}
                key={k}
                src={`/jigsaw/${k}.png`}
                onClick={() => setImage(k)}
              />
            ))}
          </div>
          <div className="button" onClick={iniciar}>
            Comenzar
          </div>
        </>
      ) : null}

      {/* Ventana del juego */}
      {tab === 2 ? (
        <div className="puzzle">
          {image !== null ? (
            <JigsawPuzzle
              imageSrc={`/jigsaw/${image}.png`}
              rows={2}
              columns={2}
              onSolved={() => setWin(true)}
            />
          ) : null}
        </div>
      ) : null}

      {/* Ventana del premio */}
      {tab === 3 ? (
        <>
          <h1>{text}</h1>
          <h1>{premio}</h1>
          <div className="button" onClick={restart}>
            REINICIAR
          </div>
        </>
      ) : null}
    </div>
  );
}
