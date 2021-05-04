import React from 'react';
import { connect } from 'react-redux';

import './DMsDefaultMessage.css';

class DMsDefaultMessage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      myIDs: [],
      messageEmail: "",
      messageName: "",
      messagePicture: "",
      messageElements: []
    };
  }

  componentDidMount() {
    this.reloadData();
  }

  componentDidUpdate(prevProps, prevState) {
    const propsOpenedChat = this.props.openedChat;
    const thisChat = this.props.chats[propsOpenedChat];
    const prevCurrentChat = prevProps.chats[propsOpenedChat];

    const messagesExist = thisChat.messages != null && thisChat.messages.length > 0;
    const sentNewMessage = prevCurrentChat.messages != thisChat.messages && prevCurrentChat.messages[prevCurrentChat.messages.length - 1].id == this.state.myIDs[this.state.myIDs.length - 1];
    const openedChatChanged = prevProps.openedChat != propsOpenedChat;

    const idsChanged = prevState.myIDs != this.state.myIDs;
    const themLastReadChanged = prevCurrentChat.lastRead.them != thisChat.lastRead.them;
    if (messagesExist && (sentNewMessage || openedChatChanged)) {
      this.reloadData();
      this.reloadMessages(prevProps);
    } else {
      if (idsChanged || themLastReadChanged) {
        this.reloadMessages(prevProps);
      }
    }
  }

  reloadData() {
    const propsOpenedChat = this.props.openedChat;

    const myChat = this.props.chats[propsOpenedChat];
    const myChatMessages = this.props.chats[propsOpenedChat].messages;

    const firstMessageID = myChatMessages[0].id;
    const myID = this.props.id;
    var ids = [];
    var from = "";

    for (var i = myID - firstMessageID; true; i++) {
      if (from.length == 0) {
        from = myChatMessages[i].from;
      }
      // console.log("i: " + i);
      // console.log("current id: " + (i + firstMessageID));
      // console.log("current message: ", myChatMessages[i]);
      if (myChatMessages[i].from != from) {
        break;
      }
      ids.push(i + firstMessageID);
      if (myChatMessages[i + 1] == null) {
        break;
      }
    }

    // console.log(ids);

    if (from == "me") {
      this.setState({
        myIDs: ids,
        messageEmail: this.props.myEmail,
        messageName: this.props.myName,
        messagePicture: this.props.myPicture,
      });
    } else if (from == "them") {
      this.setState({
        myIDs: ids,
        messageEmail: this.props.knownPeople[propsOpenedChat].email,
        messageName: this.props.knownPeople[propsOpenedChat].name,
        messagePicture: this.props.knownPeople[propsOpenedChat].picture,
      });
    }
  }

  reloadMessages(prevProps) {
    let myOldMessages;
    if (prevProps != null) {
      myOldMessages = prevProps.chats[this.props.openedChat].messages;
    }
    let newMessages = [];
    const thisChat = this.props.chats[this.props.openedChat];
    this.state.myIDs.filter(item => {
      const message = thisChat.messages.find( ({ id }) => id === item );
      if (message == null) {
        return false;
      }
      return true;
    }).map(item => {
      const message = thisChat.messages.find( ({ id }) => id === item );
      const messageKey = "id" + item;

      const lastRead = thisChat.lastRead.them;



      let lastReadElement;
      if (lastRead != null && item == lastRead) {
        let myClasses = "dmsLastRead dmsIndicatorHide";
        if (!this.props.inChat && lastRead != thisChat.messages[thisChat.messages.length - 1].id) {
          myClasses = "dmsLastRead";
        }
        if (myOldMessages != null && myOldMessages[myOldMessages.length - 1].id + 1 == thisChat.messages[thisChat.messages.length - 1].id) {
          myClasses += " noTransition";
        }
        lastReadElement = <img src={this.props.knownPeople[this.props.openedChat].picture} className={myClasses} alt={this.props.knownPeople[this.props.openedChat].name} />;
      }
      let messageElement;
      if ("sending" in message) {
        messageElement = <p key={messageKey} className="defaultMessageText defaultMessageSending">{message.message}</p>;
      } else {
        messageElement = <p key={messageKey} title={this.parseDate(message.timestamp)} className="defaultMessageText">{message.message}{lastReadElement}</p>;
      }

      newMessages.push(messageElement);
    });
    this.setState({messageElements: newMessages});
  }

  parseDate(timestamp) {
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(timestamp * 1000);

    let month = shortMonths[date.getMonth()];
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;

    const fullString = month + ' ' + date.getDate() + ', ' + date.getFullYear() + ' • ' + hours + ':' + minutes + ' ' + ampm;

    return(fullString);
  }

  render() {
    return (
      <div className="DMsDefaultMessage">


        <img src={this.state.messagePicture} className="defaultMessagePFP" alt={this.state.messageName} />
        <div className="defaultMessageName">
          {this.state.messageName}
          {/*sendingElement*/}
        </div>
        <div className="defaultMessageGroup">
          {this.state.messageElements}
        </div>
        <h1 className="defaultMessageTimestamp">{/*timestampElement*/}4:20 PM</h1>
        <img src={this.props.knownPeople[this.props.openedChat].picture} className={"dmsInChat dmsIndicatorHide"/*inChatClasses*/} alt={this.props.knownPeople[this.props.openedChat].name} />
        <div className={"dmsInChatTyping dmsInChatTypingHide"/*inChatTypingClasses*/}>
          <div className="dmsInChatTypingDot" style={{left: "15px", animationDelay: ".25s"}}></div>
          <div className="dmsInChatTypingDot" style={{left: "24px", animationDelay: ".5s"}}></div>
          <div className="dmsInChatTypingDot"></div>
        </div>


      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  openedChat: state.dms.openedChat,
  chats: state.dms.chats,
  myName: state.user.name,
  myEmail: state.user.email,
  myPicture: state.user.picture,
  knownPeople: state.people.knownPeople
});

export default connect(mapStateToProps, null)(DMsDefaultMessage);
