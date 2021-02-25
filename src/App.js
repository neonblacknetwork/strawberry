import React, { useEffect, useState } from 'react';
import { Switch, Route, useHistory, withRouter } from "react-router-dom";
import firebase from 'firebase';
import { /*useSelector, useDispatch,*/ connect } from 'react-redux';

//import { signedIn } from './StartFirebase'
import './App.css';
import {
  setUserName,
  setUserEmail,
  setUserPicture
} from './redux/userReducer';

import Overlay from './App/Overlay';
import TopBar from './App/TopBar';
import LeftPanel from './App/LeftPanel';
import MainPanel from './App/MainPanel';
import RightPanel from './App/RightPanel';

//import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
//firebase.initializeApp(config);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {pageLoaded: false};
  }

  componentDidMount() {
    //const dispatch = useDispatch();

    //const history = useHistory();
    //const welcomePage = () => history.push('/welcome');
    //const dmsPage = () => history.push('/dms');

    firebase.auth().onAuthStateChanged(user => {
      if (!(!!user)) {
        //welcomePage();
        this.props.history.push("/welcome");
        this.setState({
          pageLoaded: true
        })
      } else {
        this.props.history.push("/dms");
        //dmsPage();
        this.props.setUserName(user.displayName);
        this.props.setUserEmail(user.email);
        this.props.setUserPicture(user.photoURL);
        this.setState({
          pageLoaded: true
        })
      }
    });
  }

  render() {
    return (
      <div className="App">
        { this.state.pageLoaded ?
          <Switch>
            <Route path="/welcome">
              <Overlay type="welcome" />
            </Route>
            <Route path="/">
              <TopBar />
              <LeftPanel />
              <MainPanel />
              <RightPanel />
            </Route>
          </Switch>

          :

          <Overlay type="loading" />
        }

      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  name: state.name,
  email: state.email,
  picture: state.picture
});

const mapDispatchToProps = {
    setUserName,
    setUserEmail,
    setUserPicture
}

//export default withRouter(App);
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(App));
