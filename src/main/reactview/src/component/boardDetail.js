import axios from 'axios';
import React, {useState, useEffect} from 'react';
import {useParams, useNavigate, useLocation, Link} from 'react-router-dom';
import {Container, Row, Col, Button, Carousel, Stack, Modal} from 'react-bootstrap';
import '../css/boardDetail.css';
import {formatDistanceToNow, parseISO} from 'date-fns';
import {ko} from 'date-fns/locale';
import 'bootstrap-icons/font/bootstrap-icons.css';

function BoardDetail({csrfToken}) {
    let [tradeBoard, setTradeBoard] = useState({});
    const [isAuthor, setIsAuthor] = useState(false);

    let [imageList, setImageList] = useState([]);
    let [currentImage, setCurrentImage] = useState(0);
    const [nickName, setNickName] = useState('');
    const [showModal, setShowModal] = useState(false); // Modal 표시 여부 상태
    const {id} = useParams();
    const [isLiked, setIsLiked] = useState();
    const navigate = useNavigate();
    const [countUserItems, setCountUserItems] = useState(0);
    const [userBoardItems, setUserBoardItems] = useState([]);
    const location = useLocation();
    const handleEditClick = () => {
        navigate(`/writeForm/${id}`, {state: {tradeBoard, imageList}});
    };

    const handleDeleteClick = () => {
        axios
            .post('/api/tradeBoard/deleteRequest', tradeBoard.id, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            }).then((response) => {
            alert('삭제 처리 되었습니다.');
            window.location.href = "/boardList/";
        })
            .catch((error) => {
                console.log(error);
                alert(error);
            })
    };


    const fetchData = () => {
        axios
            .get(`/api/boardDetail/${id}`)
            .then((response) => {
                if (response.status === 200) {
                    setTradeBoard(response.data.tradeBoard);
                    let list = [...response.data.imageList];
                    let userList = [...response.data.userBoardItems];
                    setNickName(response.data.nickName);
                    setImageList(list);
                    setIsAuthor(response.data.author);
                    setIsLiked(response.data.wish);
                    setCountUserItems(response.data.countUserItems);
                    setUserBoardItems(userList);
                    console.log(JSON.stringify(response.data.userBoardItems) + "아이템전 ㄹㅇㅋㅋ");

                } else {
                    alert("알 수 없는 오류");
                    window.history.back(); // 이전 페이지로 이동
                }
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.error) {
                    alert(error.response.data.error);
                } else {
                    console.log(error);
                    alert("error");
                }
                window.history.back(); // 이전 페이지로 이동
            });
    };


    useEffect(() => {
        fetchData();

    }, []);

    let timeAgo = '';
    if (tradeBoard.createdDate) {
        timeAgo = formatDistanceToNow(parseISO(tradeBoard.createdDate), {addSuffix: true, locale: ko});
    }

    const handleImageClick = (index) => {
        setCurrentImage(index);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const chatRoom = () => {
        axios
            .post('/chatRoom', tradeBoard.id, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            })
            .then((response) => {
                window.location.href = window.location.origin + '/getchatting';
            })
            .catch((error) => {
                if (error.response && error.response.status === 400) {
                    alert("이미 존재하는 구매 요청입니다.");
                    window.location.href = error.response.data;
                } else {
                    // Other errors - Show generic error message in alert
                    console.log(error);
                    alert('An error occurred.');
                }
            });
    };

    const handleLikeClick = () => {
        if (!isLiked) {
            // 기존 찜하기 상태가 아니면 interesting 카운트 1 증가
            setTradeBoard(() => ({
                ...tradeBoard,
                interesting: tradeBoard.interesting + 1,
            }));
            setIsLiked(true);
        } else {
            // 기존 찜하기 상태면 interesting 카운트 1 감소
            setTradeBoard(() => ({
                ...tradeBoard,
                interesting: tradeBoard.interesting - 1,
            }));
            setIsLiked(false);
        }

        axios.post(
            '/api/tradeBoard/like',
            {
                id: tradeBoard.id,
                isLiked: !isLiked
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                }
            }
        )
            .then((response) => {
                // 필요한 경우 API 성공 응답 처리
            })
            .catch((error) => {
                // 필요한 경우 API 오류 처리
            });
    };

    return (
        <Container>
            <Row className="board-top">
                <Col className="overflow-container img-container">
                    <Carousel
                        variant={'dark'}
                        interval={null}
                        slide={false}
                        activeIndex={currentImage}
                        onSelect={(index) => setCurrentImage(index)}
                    >
                        {imageList.map((img, index) => (
                            <Carousel.Item key={img.id}>
                                <img
                                    src={`https://storage.cloud.google.com/reboot-minty-storage/${img.imgUrl}`}
                                    alt="Board Image"
                                    className="board-img"
                                    onClick={() => handleImageClick(index)}
                                    // 이미지 클릭 이벤트 처리
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>
                </Col>
                <Col className="content-container">
                    <Stack gap={5}>
                        <h2>{tradeBoard.title}</h2>
                        <h2>{Number(tradeBoard.price).toLocaleString()} 원</h2>
                        <h2>{nickName}</h2>
                    </Stack>
                    <Col className="board-stats">
                        <span> <i
                            className={`bi ${isLiked ? "bi-heart-fill" : "bi-heart"}`}></i> {tradeBoard.interesting}</span>
                        <span>👁‍ {tradeBoard.visit_count}</span>
                        <span>{timeAgo}</span>
                    </Col>
                    <Col className="button-groups">
                        {!isAuthor && (
                            <button className="interesting-button" onClick={handleLikeClick}>
                                {isLiked ? (
                                    <>
                                        찜하기취소
                                    </>
                                ) : (
                                    <>
                                        찜하기
                                    </>
                                )}
                            </button>
                        )}
                        {!isAuthor && tradeBoard.tradeStatus == "SELL" &&
                            <button className="interesting-button" onClick={chatRoom}>채팅</button>}
                        {/*{!isAuthor &&<Button variant="success" onClick={purchasingReq}>*/}
                        {/*  구매 신청*/}
                        {/*</Button>}*/}
                    </Col>
                </Col>
            </Row>
            <Row className="board-content">
                <Col md={8} style={{whiteSpace: "pre-wrap"}}>
                    <br/><span>상품 정보</span><br/>
                    {tradeBoard.content}
                </Col>
                <Col md={4}>
                    <div className="user-info-container-top">
                        <br/><span>개인상점 정보</span><br/>
                    </div>
                    <div className="user-info-container">
                        <img
                            src={`https://storage.cloud.google.com/reboot-minty-storage/${tradeBoard.user?.image}`}
                            className="detail-user-img"
                        />
                        <div className="user-info-detail">
                            <div className="user-level">Lv.{tradeBoard.user?.level}</div>
                            <div className="user-nickName">{tradeBoard.user?.nickName}</div>
                        </div>
                    </div>
                    <div className="user-sell-count">
                        {tradeBoard.user?.nickName} 님의 판매 상품 : {countUserItems} 개
                    </div>
                    <div className="user-sell-item-list">
                        {userBoardItems.map((item) => (
                            <a href={`/boardDetail/${item.id}`} key={item.id}
                               style={{textDecoration: 'none', color: 'black'}}>
                                <div className="detail-item">
                                    <img
                                        src={`https://storage.cloud.google.com/reboot-minty-storage/${item.thumbnail}`}
                                        className="detail-item-img"
                                    />
                                    <span className="detail-item-title">{item.title}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                    <div className="more-button-container">
                        <a href={`/usershop/${tradeBoard.user?.id}`} className="more-button"
                           style={{textDecoration: 'none'}}>
                            <span style={{color: 'blue'}}>{countUserItems}</span><span style={{color: 'black'}}>개의 상품 더보기 ></span>
                        </a>
                    </div>

                </Col>
            </Row>
            <br/>
            <br/>
            <div className="content-button">
                {isAuthor &&
                    <>
                        <Button variant="outline-info" onClick={handleEditClick} style={{color: "grey"}}>수정</Button>
                        <Button variant="outline-info" onClick={handleDeleteClick} style={{color: "grey"}}>삭제</Button>
                        <Button variant="outline-info" href="/boardList/" style={{color: "grey"}}>목록</Button>
                    </>
                }
                {!isAuthor && (
                    <Button variant="outline-info" href="/boardList/" style={{color: "grey", width: "95%"}}>목록</Button>
                )}
            </div>



            <Modal show={showModal} onHide={handleCloseModal} centered size='lg'>
                <Modal.Body>
                    <img
                        src={`https://storage.cloud.google.com/reboot-minty-storage/${imageList[currentImage]?.imgUrl}`}
                        alt="Board Image"
                        className="modal-img"
                    />
                </Modal.Body>
            </Modal>
        </Container>
    )
        ;
}

export default BoardDetail;