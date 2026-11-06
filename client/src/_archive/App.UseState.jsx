import React, {useState} from 'react';
import { Component } from 'react';

class AppUseState extends Component {
    // field to store reactive data
    state = { data: false };

    // regular class method to update state
    toggle = () => this.setState({ data: !this.state.data });

    // markup
    render() {
        const { data } = this.state;
        return (
            <main>
                <h1>Class component with State</h1>
                <p>{data === true ? 'True' : 'False'}</p>
                <button onClick={this.toggle}> Toggle </button>
            </main>
        );
    }
}


function App1(){
const [confirmation,setState]=useState({isConfirmed:false});

const toggle=()=>{
    setState({isConfirmed: true})
    console.log(confirmation.isConfirmed)
}

    return (
        <main>
            <h1>Class component with State</h1>
            <p>{confirmation.isConfirmed === true ? 'True' : 'False'}</p>
            <button onClick={toggle}> Toggle </button>
        </main>
    );
}
// we can use any value we want, numbers, object, arrays
// we can use multiple useState
// state is async

// we can't mutate state
// we need to pass a new instance each time
// we can't use conditionally

export default App1;