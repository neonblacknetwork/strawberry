import React from 'react';
import { withRouter } from "react-router-dom";
import { connect } from 'react-redux';

import './LPDMs.css';
import {
  setNotificationCount
} from '../../redux/userReducer';
import {
  setopenedChat
} from "../../redux/dmsReducer"
import DMChat from './LPDMs/DMChat'
import DMNewChat from './LPDMs/DMNewChat'

class LPDMs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      faviconHref: "/favicon_package/favicon.ico",
      children: []
    };
  }

  componentDidMount() {
    if (this.props.openedChat != "") {
      this.props.history.push("/dms/" + this.props.openedChat);
    }

    this.reloadChats();

    document.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  componentDidUpdate(prevProps) {
    if (this.props.chats != prevProps.chats) {
      this.reloadChats();
    }
  }

  reloadChats() {
    // let children = [];
    let unreadMessages = 0;

    const noMessageChats = [];
    const chats = JSON.parse(JSON.stringify(this.props.chats));
    var chatTimestampList = Object.keys(chats).filter(function(key) {
      const thisChat = chats[key];
      const thisChatMessages = thisChat.messages;
      if (thisChatMessages == null) {
        noMessageChats.push(key);
        return false;
      } else {
        if (thisChatMessages[thisChatMessages.length - 1].id > thisChat.lastRead.me) {
          unreadMessages++;
        }
      }
      return true;
    }).map(function(key) {
      const thisChatMessages = chats[key].messages;
      return [key, thisChatMessages[thisChatMessages.length - 1].timestamp];
    });
    noMessageChats.forEach(function (item, index) {
      const thisChat = chats[item];
      chatTimestampList.push([item, thisChat.created]);
    });

    chatTimestampList.sort(function(first, second) {
      return second[1] - first[1];
    });
    const chatKeys = chatTimestampList.map(function(x) {
        return x[0];
    });
    if (Array.isArray(chatKeys) && chatKeys.length) {
      let newChildren = [];
      chatKeys.map(item => {
        const chatElement = <DMChat key={"id" + item} chatEmail={item} />;
        newChildren.push(chatElement);
      });
      this.setState({
        children: newChildren
      });
    } else {
      const newChildren = (
        <div key="id_no_chats" style={{display: "table", width: "100%", height: "100%"}}>
          <h1 style={{position: "relative", display: "table-cell", margin: "0", textAlign: "center", verticalAlign: "middle", color: "#fff5", fontSize: "16px"}}>No chats</h1>
        </div>
      );
    }

    this.props.setNotificationCount({type: "dms", count: unreadMessages});
  }

  handleKeyDown(e) {
    if (e.ctrlKey && e.which === 38) {
      for (var i = 0; i < this.state.children.length; i++) {
        if (this.state.children[i].props.chatEmail == this.props.openedChat) {
          if (i != 0) {
            const newChat = this.state.children[i - 1].props.chatEmail;
            this.props.setopenedChat(newChat);
            this.props.history.push("/dms/" + newChat);
          } else {
            this.props.history.push("/home");
          }
          break;
        }
      }
    } else if (e.ctrlKey && e.which === 40) {
      if (this.props.history.location.pathname.startsWith("/home")) {
        const newChat = this.state.children[0].props.chatEmail;
        this.props.setopenedChat(newChat);
        this.props.history.push("/dms/" + newChat);
      } else {
        for (var i = 0; i < this.state.children.length; i++) {
          if (this.state.children[i].props.chatEmail == this.props.openedChat) {
            if (i != this.state.children.length - 1) {
              const newChat = this.state.children[i + 1].props.chatEmail;
              this.props.setopenedChat(newChat);
              this.props.history.push("/dms/" + newChat);
            }
            break;
          }
        }
      }
    }
  }

  render() {
    return (
      <div className="LPDMs">
        <div className="lpdmChats">
          { this.state.children }
        </div>
        <DMNewChat />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  openedChat: state.dms.openedChat,
  chats: state.dms.chats
});

const mapDispatchToProps = {
  setNotificationCount,
  setopenedChat
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(LPDMs));
