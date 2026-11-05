import {useState} from "react";

const ComponentWithInnerState=({counter})=>{
    const [state, setState]=useState(counter);
    return (
        <>
            <h2>Inner Counter: {state}</h2>
            <div>
                <button type='button' onClick={()=>setState(state+1)}>Increment</button>
            </div>
        </>
    )
}

const App=()=>{
    const [state,setState]=useState(0);
    return (
        <>
            <h1>App Counter:  {state}</h1>
            <div>
                <button type='button' onClick={()=>setState(state+1)}>Increment</button>
            </div>

            <ComponentWithInnerState counter={state}/>
        </>
    )
}