import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route } from "react-router-dom";
import TextareaAutosize from 'react-autosize-textarea';

import './MPDMs.css';
import {
  setopenedChat,
  // addMessage,
  addSendingMessage,
  setTempMessageInput
} from '../../redux/dmsReducer';
import ethan from "../../assets/images/ethan.webp"
import {
  dms_send_message
} from '../../socket.js';

class MPDMs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      messages: []
    };
    //this.baseState = this.state;

    this.messagesRef = React.createRef();
    this.inputRef = React.createRef();

    this.handleInputChange = this.handleInputChange.bind(this);
    this.inputEnterPressed = this.inputEnterPressed.bind(this);
  }

  componentDidMount() {
    this.props.setopenedChat(this.props.match.params.chatEmail);

    console.log("[MPDMs]: componentDidMount with thread ID " + this.props.openedChat);
    //this.messagesRef.current.scrollTop = this.messagesRef.current.scrollHeight;
    if (this.props.openedChat in this.props.chats) {
      this.reloadMessages();

      const tmi = this.props.chats[this.props.openedChat].tempMessageInput;
      if (tmi != "") {
        this.setState({
          inputValue: tmi
        });
      }
    }

    this.inputRef.current.focus();
  }

  componentDidUpdate(prevProps) {
    console.log("[MPDMs]: componentDidUpdate with thread ID " + this.props.openedChat);
    const propsOpenedChat = this.props.openedChat;
    if (prevProps.openedChat != propsOpenedChat || prevProps.chats[propsOpenedChat] != this.props.chats[propsOpenedChat]) {
      this.reloadMessages();
      this.setState({inputValue: ""});
      this.inputRef.current.focus();
    }

    const thisChat = this.props.chats[this.props.openedChat];
    if (thisChat != null) {
      const iv = this.state.inputValue
      const tmi = thisChat.tempMessageInput
      if (this.props.openedChat != "" && prevProps.openedChat != propsOpenedChat) {
        if (prevProps.openedChat in this.props.chats) {
          this.props.setTempMessageInput({
            chat: prevProps.openedChat,
            input: iv
          });
        }

        this.setState({
          inputValue: tmi
        });
      }
    }
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    const iv = this.state.inputValue
    if (this.props.openedChat in this.props.chats) {
      this.props.setTempMessageInput({
        chat: this.props.openedChat,
        input: iv
      });
    }
  }

  reloadMessages() {
    const thisChatReference = this.props.chats[this.props.openedChat];
    const thisChat = JSON.parse(JSON.stringify(thisChatReference));
    //const startID = thisChat["messages"][0]["id"];
    //let nextID = startID;

    if (thisChat == null || thisChat["messages"].length <= 0) {
      this.setState({
        messages: []
      });
      return false;
    }

    let hasSending = false;
    let handledSending = false;

    if ("sendingMessages" in thisChat && thisChat["sendingMessages"].length > 0) {
      hasSending = true;
      let myID = thisChat.messages[thisChat.messages.length - 1].id + 1;
      thisChat["sendingMessages"].map(item => {
        const myMessage = {message: item, sending: true, id: myID};
        thisChat["messages"].push(myMessage);
        myID++;
      });
    }

    let nextID = thisChat["messages"][0]["id"];
    let tempMessages = [];
    thisChat["messages"].map((message, i) => {
      console.debug(message);

      if (message["id"] >= nextID && !("sending" in message)) {
        let messageIDs = [message["id"]];
        const messageFrom = message["from"];
        console.debug("before while");
        while (true) {
          const localNextID = messageIDs[messageIDs.length - 1] + 1;
          const findNextID = thisChat["messages"].find( ({ id }) => id === localNextID );

          console.debug("findNextID: " + JSON.stringify(findNextID));
          // console.debug(findNextID);

          if (findNextID == null) {
            console.debug("breaking, due to null");
            break;
          }

          if ("sending" in findNextID && messageFrom == "me") {
            console.log("HANDLED SENDING");
            handledSending = true;
          }

          if (findNextID["from"] == messageFrom || handledSending) {
            messageIDs.push(localNextID);
            nextID = localNextID + 1;
          } else {
            console.debug("breaking, due to new sender");
            break;
          }
        }
        console.debug("after while... " + messageIDs);

        const myPerson = this.props.getknownPeople[this.props.openedChat];
        let newMessageName = "";
        let newMessagePicture = "";
        if (myPerson != null) {
          newMessageName = messageFrom == "me" ? this.props.myName : myPerson.name;
          newMessagePicture = messageFrom == "me" ? this.props.myPicture : myPerson.picture;
        }

        const lastMessage = thisChat.messages[thisChat.messages.length - 1];
        let sendingElement;
        if (lastMessage.id == messageIDs[messageIDs.length - 1] && "sending" in lastMessage) {
          sendingElement = <h1 className="recieveMessageSendingText">Sending...</h1>;
        }

        const lastID = messageIDs[messageIDs.length - 1];
        const lastReadyMessage = thisChat["messages"].find( ({ id }) => id === lastID );
        let timestampElement;
        if (!("sending" in lastReadyMessage)) {
          timestampElement = lastReadyMessage.timestamp;
        }
        const newMessage = (
          <div className="recieveMessage" key={"group" + i}>
          <img src={newMessagePicture} className="recieveMessagePFP" alt={newMessageName} />
            <div className="recieveMessageName">
              {newMessageName}
              {sendingElement}
            </div>
            <div className="recieveMessageGroup">
              {
                messageIDs.map(item => {
                  const message = thisChat["messages"].find( ({ id }) => id === item );
                  const messageKey = "id" + item;
                  console.debug("messageKey: " + messageKey);
                  let messageElement;
                  if ("sending" in message) {
                    messageElement = <p key={messageKey} className="recieveMessageText recieveMessageSending">{message.message}</p>;
                  } else {
                    messageElement = <p key={messageKey} className="recieveMessageText">{message.message}</p>;
                  }
                  return messageElement;
                })
              }
            </div>
            <h1 className="recieveMessageTimestamp">{timestampElement}</h1>
          </div>
        );
        console.debug(newMessage);
        tempMessages.push(newMessage);
      }
    });

    console.debug("COMPLETE, HERES SENDING:");
    console.debug(hasSending);
    console.debug(handledSending);
    if (hasSending && !handledSending) {
      let myName = this.props.myName;
      let myPicture = this.props.myPicture;
      const newMessage = (
        <div className="recieveMessage" key={"sendinggroup"}>
        <img src={myPicture} className="recieveMessagePFP" alt={myName} />
          <div className="recieveMessageName">
            {myName}
            <h1 className="recieveMessageSendingText">Sending...</h1>
          </div>
          <div className="recieveMessageGroup">
            {
              thisChat["sendingMessages"].map(item => {
                console.debug(item);
                const messageKey = "id" + item;
                const messageElement = <p key={messageKey} className="recieveMessageText recieveMessageSending">{item}</p>;
                return messageElement;
              })
            }
          </div>
        </div>
      );
      console.debug(newMessage);
      tempMessages.push(newMessage);
    }

    this.setState({messages: tempMessages});
  }

  handleInputChange(event) {
    this.setState({
      inputValue: event.target.value
    });
  }

  inputEnterPressed(event) {
    var code = event.keyCode || event.which;
    if (code === 13 && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();

      const iv = this.state.inputValue;
      if (iv != null && iv != "") {
        dms_send_message(this.props.openedChat, iv);
        this.props.addSendingMessage({message: iv});
        this.setState({inputValue: ""});
      }
    }
  }

  render() {
    let otherName = "";
    if (this.props.getknownPeople[this.props.openedChat] != null) {
      otherName = this.props.getknownPeople[this.props.openedChat].name;
    }

    return (
      <div className="MPDMs">
        <div className="dmsMessages" ref={this.messagesRef}>
          {
            (this.props.openedChat != "" && this.props.chats[this.props.openedChat].messages.length > 0 && this.props.chats[this.props.openedChat].messages[0].id == 0)
            || (this.props.openedChat != "" && this.props.chats[this.props.openedChat].messages.length <= 0) ?

            <div className="dmsStartConversationDiv">
              <h1 className="dmsStartConversationText">This is the start of your conversation with {otherName}</h1>
            </div>

            :

            null
          }
          {this.state.messages}
        </div>
        {this.state.messages.length > 0 ? null : <h1 className="dmsNoMessageText">No messages.<br/>Try sending one!</h1>}
        <TextareaAutosize value={this.state.inputValue} onChange={this.handleInputChange} onKeyPress={this.inputEnterPressed} placeholder="Type message here" className="dmsMessagesInput" maxLength="2000" ref={this.inputRef} />
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
  getknownPeople: state.people.knownPeople
});

const mapDispatchToProps = {
  setopenedChat,
  // addMessage,
  addSendingMessage,
  setTempMessageInput
}

export default connect(mapStateToProps, mapDispatchToProps)(MPDMs);
