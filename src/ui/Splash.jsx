 import Header from "./Header";

 export default function Splash({ onStart }) {
   return (
    <section className="screen splash font-regular"> {/* <- Regular */}
       {/* LOGO grande y más arriba */}
       <img
         className="s-logo"
         src="/images/logo-renault.png"
         alt="Renault"
       />

       {/* Texto y botón */}
     <div className="hero s-hero">
       <div className="big font-regular">   {/* <- asegura Regular */}
           bienvenidos a la experiencia Renault,
           <br />
           donde cada pieza revela lo extraordinario
         </div>

       <div className="small font-regular" style={{ marginTop: 10 }}>
           Toca “Iniciar” para comenzar
         </div>

         <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onStart}>
           Iniciar
         </button>
       </div>
     </section>
   );
 }



