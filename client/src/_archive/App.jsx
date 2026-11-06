// In this lesson

// 0. Intro about functional and class components
// 1. rewrite to class component

//// You can convert a function component to a class in five steps:
//// 1. Create class with the same name, that extends React.Component.
//// 2. Add a single empty method to it called render().
//// 3. Move the body of the function into the render() method.
//// 4. Replace props with this.props in the render() body.
//// 5. Delete the remaining empty function declaration.

// 2. Add boolean prop `show` to state in 2 ways to declare state
// 3. Discuss && in template, null, early return
// 4. Add button to toggle visibility in app
// 5. In child component create inner state based on prop.
//    Discuss when is it ok, note how to do that using constructor
// 6. Add handleClick for click on "Everyone" to change ot to "Me".
//    Discuss problem with bind
// 7. Add callback to hide child component when user clicks on "Me".
//    Discuss async setState

import React from "react";

class Greeting extends React.Component {

    constructor(props) {
        super(props);
        this.state={
            name: props.initialName
        }
    }

    clickHandler=()=>{
       const newVal={
           name:'Me'
       }
        this.setState({
            name:'Me'
        });
        console.log(this.state)
        if(this.state.name==='Me'){
            this.props.onHide()
        }

    }

    render() {
        console.log(this.state)
        const { initialName } = this.props;
        return (
            <h1 className="greeting">
                Hello <i className="emphasize" onClick={this.clickHandler}>{this.state.name}</i>. Welcome!
            </h1>
        );
    }
}

export default class App extends React.Component {
    // export default function App() {
    //   return <Greeting initialName="Everyone" />;
    // }


    state = {
        show:true
    }
    render() {
        return (
            <main>
                <button onClick={() => {
                    this.setState((prev) => ({ show: !prev.show }));
                }}>toggle visibility</button>
                {/*{this.state.show && <Greeting initialName="Everyone" />}*/}
                {this.state.show ? <Greeting initialName="Everyone" onHide={()=>{
                    this.setState({ show: false })
                }} /> : null}
            </main>
        )
    }
}