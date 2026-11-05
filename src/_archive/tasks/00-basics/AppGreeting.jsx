import {useState} from "react";

function Greeting({initialName, onHide}){
    const [name,setName]=useState(initialName)

    function handleClick(){
        if(name==='Me'){
            onHide()
        }else {
            setName('Me')
        }
    }
    return (
        <h1 className="greeting">
            Hello{" "}
            <i className="emphasize" onClick={handleClick}>
                {name}                                        {/* 4. виводимо стан */}
            </i>
            . Welcome!
        </h1>
    );
}

export default function App(){
    const [show,setShow]=useState(true);

    return (
        <main>
            <button onClick={()=>setShow((prev)=>!prev)} >
                toggle visibility
            </button>
            {
                show && (
                    <Greeting initialName='Everyone' onHide={()=>setShow(false)}/>
                )
            }
        </main>
    )
}