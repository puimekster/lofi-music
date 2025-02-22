import React, { useEffect, useState, useRef } from "react";
import Exit from "../../assets/images/exit.png";
import axios from "axios";
import { removeLocal, setLocal } from "../../LocalStorage/getLocal";
import SockJS from "sockjs-client";
// import Stomp from "stompjs";
import { over } from "stompjs";
import "./style.scss";
import SkeletonChat from "../../common/SkeletonChat";
import { useDispatch, useSelector } from "react-redux";
import { appendMessage, getMessage } from "../../redux/actions/messageSocket";
import ModalCreateName from "../../common/ModalCreateName/index";

var stompClient = null;
const Message = (prop) => {
	const dispatch = useDispatch();
	const { openChatHandler } = prop;
	const [message, setMessage] = useState("");
	const [openModal, setOpenModal] = useState(false);
	const [chanel, setChanel] = useState("CHANNEL_1");

	const nameStorage = setLocal("name");
	const tokenStorage = setLocal("token");
	const MessageReducer = useSelector((state) => state.MessageReducer);
	const { list } = MessageReducer;

	const SOCKET_URL = `${process.env.REACT_APP_LOFI_URL}/ws`;
	const url = `${process.env.REACT_APP_LOFI_URL}/rest/message`;

	var sub = useRef(chanel);

	const changeChanel = (e) => {
		stompClient.disconnect();
		sub.current = e.target.value;
		setChanel(e.target.value);
	};
	useEffect(() => {
		ConnectSocket();
	}, [chanel]);

	const ConnectSocket = () => {
		let Sock = new SockJS(SOCKET_URL);
		stompClient = over(Sock);
		stompClient.connect({}, onConnected, onError);
	};
	const onConnected = () => {
		dispatch(getMessage(chanel));
		stompClient.subscribe(`/message/${chanel}`, function (m) {
			const m2 = JSON.parse(m.body);
			dispatch(appendMessage(m2));
		});
	};
	const onError = (err) => {
		console.log(err);
	};
	const inputMessage = (e) => {
		setMessage(e.target.value);
	};

	const sendMessage = async () => {
		setMessage("");
		try {
			await axios
				.post(url, {
					message: message,
					token: tokenStorage,
					guestName: nameStorage,
					channel: chanel,
				})
				.then((res) => {
					console.log("post message: ", res.data);
				})
				.catch((err) => console.log("error", err));
		} catch (error) {
			console.error(error);
		}
	};

	const handleKeyUp = (e) => {
		if (e.keyCode === 13) sendMessage();
	};

	const messageRef = useRef();
	useEffect(() => {
		if (messageRef.current) {
			messageRef.current.scrollIntoView({
				behavior: "smooth",
				block: "end",
				inline: "nearest",
			});
		}
	}, [list]);

	const handleShowChangeName = () => {
		removeLocal("name");
		removeLocal("userName");
		removeLocal("token");
		removeLocal("tokenAdmin");
		window.location = "/";
	};

	return (
		<>
			<div className="form-message">
				<div className="message-header">
					<div className="form-group">
						<label className="label-chanel" htmlFor="select1">
							{chanel}
						</label>
						<select
							value={chanel}
							onChange={(e) => changeChanel(e)}
							className="form-control"
						>
							<option value="select">Select an chanel</option>
							<option value="CHANNEL_1">CHANNEL_1</option>
							<option value="CHANNEL_2">CHANNEL_2</option>
							<option value="CHANNEL_3">CHANNEL_3</option>
						</select>
					</div>

					<div onClick={handleShowChangeName} className="message-menu">
						<button>Đổi tên</button>
					</div>
				</div>
				<div className="message-content">
					{list.length === 0 && <SkeletonChat />}
					<div ref={messageRef} className="guest">
						{list &&
							list.map((item, id) => (
								<div key={id} className="message-guest">
									<span className="guest-name">
										<p>{item.guestName}</p> : {item.message}
									</span>
								</div>
							))}
					</div>
				</div>
				<div className="message-send">
					<input
						value={message}
						onChange={(e) => inputMessage(e)}
						type="text"
						placeholder="Write a message..."
						onKeyUp={handleKeyUp}
					/>
					<i onClick={ConnectSocket} className="bx bx-wink-smile"></i>
					<i onClick={sendMessage} className="bx bx-send"></i>
				</div>
			</div>
		</>
	);
};

export default Message;
