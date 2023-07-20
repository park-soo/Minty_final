import React, {useState, useEffect, useRef} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import axios from 'axios';
import {Button, Container, Row, Col, Nav, Form, Modal, Dropdown, DropdownButton} from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import {formatDistanceToNow, parseISO} from 'date-fns';
import {ko} from 'date-fns/locale';
import {BiSearch} from 'react-icons/bi';
import InfiniteScroll from 'react-infinite-scroll-component';
import * as turf from '@turf/turf';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import '../css/boardList.css';

function BoardList({ csrfToken }) {
    const [topCategories, setTopCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loadedBoardIds, setLoadedBoardIds] = useState([]); // 기존에 로드된 게시물의 ID 저장
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [tradeBoards, setTradeBoards] = useState([]);
    const [searchQueryInput, setSearchQueryInput] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [minPriceInput, setMinPriceInput] = useState(null);
    const [maxPriceInput, setMaxPriceInput] = useState(null);
    const [activeFilters, setActiveFilters] = useState([]);
    const [userLocationList, setUserLocationList] = useState([]);
    const [showUserLocationModal, setShowUserLocationModal] = useState(false);
    const [selectedArea, setSelectedArea] = useState('');
    const [mapLevel, setMapLevel] = useState(0);
    const [addressCode, setAddressCode] = useState([]);
    const [targetName, setTargetName] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [lineOverlay, setLineOverlay] = useState(null);
    const [level, setLevel] = useState(0);
    const [currentPolygon, setCurrentPolygon] = useState(null);
    const [currentCenter, setCurrentCenter] = useState([]);
    const [currentAdmNm, setCurrentAdmNm] = useState('');
    const [fullscreen, setFullscreen] = useState(true);
    const kakaoMap = useRef(null);
    const mapContainerRef = useRef(null);
    const mapContainerStyle = showUserLocationModal ? {width: '100%', height: '90%'} : {display: 'none'};

    const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
    const [searchQuery, setSearchQuery] = useState(searchParams?.get('searchQuery') ? searchParams.get('searchQuery') : '');
    const [subCategoryId, setSubCategoryId] = useState(searchParams?.get('subCategoryId') ? searchParams?.get('subCategoryId') : null);
    const [minPrice, setMinPrice] = useState(searchParams?.get('minPrice') ? searchParams?.get('minPrice') : null);
    const [maxPrice, setMaxPrice] = useState(searchParams?.get('maxPrice') ? searchParams?.get('maxPrice') : null);
    const [sortBy, setSortBy] = useState(searchParams?.get('sortBy') ? searchParams?.get('sortBy') : '');
    const [searchArea, setSearchArea] = useState(searchParams?.get('searchArea') ? searchParams.get('searchArea') : []);
    const [page, setPage] = useState(searchParams?.get('page') ? parseInt(searchParams.get('page')) - 1 : 0);
    const navigate = useNavigate();
    const location = useLocation();
    const [currentPath, setCurrentPath] = useState();

    useEffect(() => {
        window.addEventListener("beforeunload", () => {
            sessionStorage.setItem("scrollPosition", window.scrollY.toString());
        });
        return () => {
            window.removeEventListener("beforeunload", () => {
                sessionStorage.setItem("scrollPosition", window.scrollY.toString());
            });
        };
    }, []);

    useEffect(() => {
        const savedBoards = JSON.parse(sessionStorage.getItem("savedBoards"));
        if (savedBoards) {
            setTradeBoards(savedBoards);
        }
        const filterSearchParams = () => {
            const filters = [];

            if (searchQuery) {
                filters.push({ type: '검색어', value: searchQuery });
            }
            if (subCategoryId) {
                filters.push({ type: '카테고리', value: subCategoryId });
            }
            if (minPrice) {
                filters.push({ type: '최소 가격', value: minPrice });
            }
            if (maxPrice) {
                filters.push({ type: '최대 가격', value: maxPrice });
            }
            if (sortBy) {
                let filterValue;
                switch (sortBy) {
                    case 'itemDesc':
                        filterValue = '최신순';
                        break;
                    case 'priceAsc':
                        filterValue = '낮은 가격순';
                        break;
                    case 'priceDesc':
                        filterValue = '높은 가격순';
                        break;
                    default:
                        filterValue = '';
                        break;
                }
                filters.push({ type: '정렬 방식', value: filterValue });
            }
            if (searchArea.length > 0) {
                filters.push({ type: '지역', value: searchArea });
            }

            setActiveFilters(filterSearchParams);
        };
    }, []);


    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        window.history.replaceState({}, '', '?' + newSearchParams.toString());
    }, [searchParams]);

    useEffect(() => {
        fetchData();
    }, [searchQuery, subCategoryId, minPrice, maxPrice, sortBy, searchArea]);

    const fetchData = async () => {
        setTimeout(async () => {
            try {
                let endpoint = '/api/boardList';

                const updateSearchParams = () => {
                    const newSearchParams = new URLSearchParams();

                    if (searchQuery) {
                        newSearchParams.set('searchQuery', searchQuery);
                    }
                    if (subCategoryId) {
                        newSearchParams.set('subCategoryId', subCategoryId);
                    }
                    if (minPrice) {
                        newSearchParams.set('minPrice', minPrice);
                    }
                    if (maxPrice) {
                        newSearchParams.set('maxPrice', maxPrice);
                    }
                    if (sortBy) {
                        newSearchParams.set('sortBy', sortBy);
                    }
                    if (searchArea) {
                        newSearchParams.set('searchArea', searchArea);
                    }
                    newSearchParams.set('page', page + 1);
                    setSearchParams(newSearchParams);
                };

                if (searchArea.length > 0) {
                    endpoint += `/searchArea/${searchArea}`;
                    updateSearchParams('searchArea', searchArea);
                }
                if (subCategoryId) {
                    endpoint += `/category/${subCategoryId}`;
                    updateSearchParams('subCategoryId', subCategoryId);
                }
                if (searchQuery) {
                    endpoint += `/searchQuery/${searchQuery}`;
                    updateSearchParams('searchQuery', searchQuery);
                }
                if (minPrice) {
                    endpoint += `/minPrice/${minPrice}`;
                    updateSearchParams('minPrice', minPrice);
                }
                if (maxPrice) {
                    endpoint += `/maxPrice/${maxPrice}`;
                    updateSearchParams('maxPrice', maxPrice);
                }
                if (sortBy) {
                    endpoint += `/sortBy/${sortBy}`;
                    updateSearchParams('sortBy', sortBy);
                }
                const nextPage = page + 1; // Calculate the next page
                setPage(nextPage); // Update the page state to the next page

                endpoint += `/page/${page + 1}`; // 여기서 1을 더해줍니다.
                console.log(endpoint);

                await axios
                    .get(endpoint)
                    .then(async (response) => {
                        let fetchedBoards = [];
                        if (!response.data || !response.data.tradeBoards || response.data.tradeBoards.length === 0) {
                            setTradeBoards([]);
                            setHasMore(false);
                        }
                        if (page > 0) {
                            const requests = Array.from({length: page}, (_, i) => {
                                let previousEndpoint = endpoint.replace(`/page/${page + 1}`, `/page/${i + 1}`);
                                return axios.get(previousEndpoint);
                                const scrollPosition = sessionStorage.getItem("scrollPosition");
                                if (scrollPosition) {
                                    window.scrollTo(0, parseInt(scrollPosition));
                                }
                            });
                            const responses = await Promise.all(requests);
                            responses.forEach(previousResponse => {
                                fetchedBoards = [...fetchedBoards, ...previousResponse.data.tradeBoards];
                            });

                        }
                        if (page === 0 && endpoint !== `/api/boardList/page/0`) {
                            setTradeBoards(response.data.tradeBoards);
                        } else {
                            setTradeBoards([...fetchedBoards, ...response.data.tradeBoards]);
                            sessionStorage.setItem("savedBoards", JSON.stringify([...fetchedBoards, ...response.data.tradeBoards])); // 저장

                        }
                        let top = [...response.data.top];
                        let sub = [...response.data.sub];
                        let hCode = [...response.data.addressCode];
                        let locations = [...response.data.userLocationList];

                        locations = locations.map(location => {
                            const address = location.address;
                            const dong = address.split(' ')[2];

                            const matchingCode = hCode.find(code => code.dong === dong);
                            if (matchingCode) {
                                return {...location, code: matchingCode.code};
                            } else {
                                return location;
                            }
                        });

                        setTopCategories(top);
                        setSubCategories(sub);
                        setUserLocationList(locations);
                        setHasMore(response.data.hasNext);
                        if (currentCenter.length === 0) {
                            setCurrentCenter([response.data.userLocationList[0].latitude, response.data.userLocationList[0].longitude]);
                            setCurrentAdmNm(locations[0].code);
                        }
                        if (searchArea.length === 0) {
                            let firstFetch = [response.data.userLocationList[0].address];
                            console.log("여기 옴?" + firstFetch);
                            setSearchArea(firstFetch);
                            setPage(0);
                        }


                    })
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }, 500);
    };


    const handleSearch = (e) => {
        e.preventDefault();
        const searchQuery = e.target.elements.searchQuery.value;
        setSearchQuery(searchQuery);
        setPage(0);
    };

    const handleAreaSearch = (loc, dong) => {
        setSelectedArea(dong);
        setSearchArea(loc.address);
        setCurrentAdmNm(loc.code);
        setPage(0);
    };


    const handleSortByChange = (e) => {
        const selectedSortBy = e.target.value;
        setSortBy(selectedSortBy);
        setPage(0);
        if (selectedSortBy) {
            let filterValue;
            switch (selectedSortBy) {
                case 'itemDesc':
                    filterValue = '최신순';
                    break;
                case 'priceAsc':
                    filterValue = '낮은 가격순';
                    break;
                case 'priceDesc':
                    filterValue = '높은 가격순';
                    break;
                default:
                    filterValue = '';
                    break;
            }

            const existingFilter = activeFilters.find((filter) => filter.type === '정렬 방식');
            if (existingFilter) {
                setActiveFilters((prevFilters) =>
                    prevFilters.map((filter) =>
                        filter.type === '정렬 방식' ? {type: '정렬 방식', value: filterValue} : filter
                    )
                );
            } else {
                setActiveFilters((prevFilters) => [...prevFilters, {type: '정렬 방식', value: filterValue}]);
            }
        }


    };

    const searchByPrice = (e) => {
        e.preventDefault();
        const minPrice = e.target.elements.minPrice.value;
        const maxPrice = e.target.elements.maxPrice.value;
        setMinPrice(parseInt(minPrice));
        setMaxPrice(parseInt(maxPrice));
        setPage(0);
        const existingMinPriceFilter = activeFilters.find((filter) => filter.type === '최소 가격');
        const existingMaxPriceFilter = activeFilters.find((filter) => filter.type === '최대 가격');

        if (minPrice && existingMinPriceFilter) {
            setActiveFilters((prevFilters) =>
                prevFilters.map((filter) =>
                    filter.type === '최소 가격' ? {type: '최소 가격', value: minPrice} : filter
                )
            );
        } else if (minPrice) {
            setActiveFilters((prevFilters) => [...prevFilters, {type: '최소 가격', value: minPrice}]);
        }

        if (maxPrice && existingMaxPriceFilter) {
            setActiveFilters((prevFilters) =>
                prevFilters.map((filter) =>
                    filter.type === '최대 가격' ? {type: '최대 가격', value: maxPrice} : filter
                )
            );
        } else if (maxPrice) {
            setActiveFilters((prevFilters) => [...prevFilters, {type: '최대 가격', value: maxPrice}]);
        }


    };


    const removeFilter = (filterType) => {
        setActiveFilters((prevFilters) => prevFilters.filter((filter) => filter.type !== filterType));
        switch (filterType) {
            case '검색어':
                setSearchQuery('');
                setPage(0);
                break;
            case '최소 가격':
                setMinPrice(null);
                setPage(0);
                break;
            case '최대 가격':
                setMaxPrice(null);
                setPage(0);
                break;
            case '정렬 방식':
                setSortBy('');
                setPage(0);
                break;
            case '카테고리':
                setSubCategoryId(null);
                setPage(0);
                break;
            default:
                break;
        }


    };


    const renderTopCategories = topCategories.map((category) => (
        <Nav.Item key={category.id}>
            <Button
                onClick={() => handleTopCategoryClick(category.id)}
                active={category.id === selectedCategory}
                className="category-link"
                style={{backgroundColor: 'white'}}
                type="button"
            >
                {category.name}
            </Button>
        </Nav.Item>
    ));

    const renderSubCategories = subCategories
        .filter((subcategory) => subcategory.topCategory.id === selectedCategory)
        .map((subcategory) => (
            <Nav.Item key={subcategory.id}>
                <Button
                    onClick={() => handleSubCategoryClick(subcategory.id, subcategory.name)}
                    className={`sub-category-link ${subCategoryId === subcategory.id ? 'active' : ''}`}
                >
                    {subcategory.name}
                </Button>
            </Nav.Item>
        ));
    const handleTopCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
        setSubCategoryId(null);
    };

    const handleSubCategoryClick = (subCategoryId, subCategoryName) => {
        setSubCategoryId(subCategoryId);
        setPage(0);
        const existingSubCategoryFilter = activeFilters.find((filter) => filter.type === '카테고리');
        if (existingSubCategoryFilter) {
            setActiveFilters((prevFilters) =>
                prevFilters.map((filter) =>
                    filter.type === '카테고리' ? {type: '카테고리', value: subCategoryName} : filter
                )
            );
        } else {
            setActiveFilters((prevFilters) => [...prevFilters, {type: '카테고리', value: subCategoryName}]);
        }
    };


    const extractDong = (address) => {
        const addressParts = address.split(" ");
        const dong = addressParts[addressParts.length - 1];
        return dong;
    };

    const setShowUserLocationList = () => {
        onLoadKakaoMap(userLocationList);
        setFullscreen(true);
        setShowUserLocationModal(true);
    };

    const handleUserLocationCloseModal = () => {
        if (kakaoMap.current) {
            const center = kakaoMap.current.getCenter();
            setCurrentCenter([center.getLat(), center.getLng()]);
            kakaoMap.current = null;
        }
        setShowUserLocationModal(false);
    }


    const onLoadKakaoMap = (locations) => {
        axios.get('/api/getMapData').then((response) => {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${response.data.apiKey}&autoload=false&libraries=services`;
            document.head.appendChild(script);
            script.onload = () => {
                window.kakao.maps.load(() => {
                    if (mapContainerRef.current) {
                        const mapOption = {
                            center: new window.kakao.maps.LatLng(currentCenter[0], currentCenter[1]),
                            level: 7
                        };
                        kakaoMap.current = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
                        drawPolygon();
                    }
                });
            };
        });
    };

    const drawPolygon = async () => {
        if (currentPolygon && currentPolygon.length > 0) {
            currentPolygon.forEach(polygon => {
                polygon.setMap(null);
            });
            setCurrentPolygon([]); // Set currentPolygon state to an empty array
        }
        let radius;
        let targetAdmNames = new Set();
        switch (mapLevel) {
            case 0:
                radius = 1;
                break;
            case 50:
                radius = 2500;
                break;
            case 100:
                radius = 5000;
                break;
        }
        try {
            const response = await axios.get('/geojson/HangJeongDong_ver20230701.geojson');
            const data = response.data;
            const feature = data.features.find(feature => feature.properties.adm_cd2 === currentAdmNm);
            let temp = feature.geometry.coordinates;
            let tempNum = temp[0][0][0];
            console.log("tempNum" + tempNum[0])
            const centerPoint = turf.point([tempNum[0], tempNum[1]]);
            const buffer = turf.buffer(centerPoint, radius, {units: 'meters'});
            const features = data.features.filter(feature => {
                const point = turf.point(feature.geometry.coordinates[0][0][0]);
                return turf.booleanPointInPolygon(point, buffer);
            });
            const polygons = [];
            targetAdmNames = new Set(features.map(feature => feature.properties.adm_nm));
            if (targetAdmNames != setSearchArea) {
                setSearchArea([...targetAdmNames]);
                setPage(0);
            }
            // Draw polygons on the Kakao Map
            targetAdmNames.forEach(admName => {
                const admFeatures = data.features.filter(feature => feature.properties.adm_nm === admName);
                admFeatures.forEach(admFeature => {
                    const paths = admFeature.geometry.coordinates[0][0].map((coord) => {
                        return new window.kakao.maps.LatLng(coord[1], coord[0]);
                    });

                    const polygon = new window.kakao.maps.Polygon({
                        path: paths,
                        strokeWeight: 0,
                        strokeStyle: 'dash',
                        fillColor: '#ABEBC6',
                        fillOpacity: 0.8,
                    });

                    polygons.push(polygon);
                    setCurrentPolygon(polygons);
                    const ct = new window.kakao.maps.LatLng(tempNum[1], tempNum[0]);
                    if (kakaoMap.current) {
                        kakaoMap.current.setCenter(ct);
                    }
                });
            });
            polygons.forEach(polygon => {
                polygon.setMap(kakaoMap.current); // Add each polygon to the map
            });
        } catch (error) {
            console.error('Error fetching GeoJSON:', error);
        }
    };


    const handleAddressLinkClick = (index) => {
        const location = userLocationList[index];
        setSelectedArea(extractDong(location.address));
        setCurrentAdmNm(location.code);
    };

    useEffect(() => {
        if (currentCenter.length > 0 && kakaoMap.current) {
            drawPolygon();
        }
    }, [currentAdmNm, mapLevel]);

    const handleSliderChange = (e) => {
        setMapLevel(parseInt(e.target.value));
    };

    const handleDeleteLocation = (index) => {
        const location = userLocationList[index];
        axios.post('/api/deleteUserLcation', location.id, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        }).then((response)=>{
            setUserLocationList(response.data);
            fetchData();
        }).catch((e) => {
            alert(e);
        });
    };

    return (
        <Container fluid className="titleBorder">
            <p className="pStyle">거래 게시판</p>
            <div className="flexFilter">
                <Row className="justify-content-start filtertext">
                    <div>
                        {activeFilters.map((filter, index) => (
                            <React.Fragment key={filter.type}>
                                <div className={`filter ${filter.value.length > 10 ? 'long-text' : ''}`}
                                     key={filter.type}>
                    <span>
                      {filter.type} : {filter.value}
                    </span>
                                    <button onClick={() => removeFilter(filter.type)}>x</button>
                                </div>
                                {(index + 1) % 2 === 0 && <br/>} {/* 줄바꿈을 위한 br 요소 */}
                            </React.Fragment>
                        ))}
                    </div>
                </Row>
                <Row className="justify-content-start">
                    <Col md={1}>
                        <Dropdown className="dark-dropdown">
                            <Dropdown.Toggle id="dropdown-button-dark" variant="secondary">
                                {selectedArea ? selectedArea : userLocationList.length > 0 ? extractDong(userLocationList[0].address) : ''}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {userLocationList.map((loc) => {
                                    const dong = extractDong(loc.address);
                                    return (
                                        <Dropdown.Item key={loc.id} onClick={() => handleAreaSearch(loc, dong)}>
                                            {dong}
                                        </Dropdown.Item>
                                    );
                                })}
                                <Dropdown.Divider style={{borderColor: "white"}}/>
                                <Dropdown.Item onClick={setShowUserLocationList}>
                                    동네 범위 설정
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>
                <Row className="justify-content-end">
                    <Col md={3}>
                        <Form.Select className="sortBy" onChange={handleSortByChange}>
                            <option value="">정렬 방식</option>
                            <option value="itemDesc">최신순</option>
                            <option value="priceAsc">낮은 가격순</option>
                            <option value="priceDesc">높은 가격순</option>
                        </Form.Select>
                        <form onSubmit={handleSearch}>
                            <Row className="d-flex ">
                                <Col sm={2}>
                                    <input type="text" className="search-input" name="searchQuery"
                                           value={searchQueryInput}
                                           onChange={(e) => setSearchQueryInput(e.target.value)}/>
                                    <button type="submit" className="searchBtn">
                                        <BiSearch/>
                                    </button>
                                </Col>
                            </Row>
                        </form>
                    </Col>
                </Row>

                <Row className="justify-content-end">
                    <Col xs="auto">
                        <a href="/writeForm" className="ml-auto">
                            <Button className="writebutton">
                                <p className="writebuttontext">글쓰기</p>
                            </Button>
                        </a>
                    </Col>
                    <Col md={3}>
                        <Form onSubmit={searchByPrice} className="d-flex align-items-center m-filter">
                            <Form.Group className="mr-2">
                                <Form.Control
                                    type="number"
                                    name="minPrice"
                                    placeholder="최소 가격"
                                    value={minPriceInput}
                                    onChange={(e) => setMinPriceInput(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mr-2">
                                <Form.Control
                                    type="number"
                                    name="maxPrice"
                                    placeholder="최대 가격"
                                    value={maxPriceInput}
                                    onChange={(e) => setMaxPriceInput(e.target.value)}
                                />
                            </Form.Group>
                            <button type="submit" className="searchBtn">
                                <BiSearch/>
                            </button>
                        </Form>
                    </Col>
                </Row>
            </div>
            <Row>
                <Col sm={1}>
                    <Nav className="flex-column">
                        <div>
                            <Button href={`/boardList`} className="category-link">
                                전체
                            </Button>
                        </div>
                        {renderTopCategories}
                    </Nav>
                </Col>
                <Col sm={1} className={selectedCategory ? 'show-subcategory' : 'hide-subcategory'}>
                    {selectedCategory && <Nav className="flex-column">{renderSubCategories}</Nav>}
                </Col>

                <Col sm={9} className={selectedCategory ? 'pushed-content' : ''}>
                    {tradeBoards ? (

                        <InfiniteScroll
                            dataLength={tradeBoards.length}
                            next={fetchData}
                            hasMore={hasMore}
                            loader={
                                <div className="loader-container">
                                    <div className="loader"></div>
                                </div>
                            }

                            scrollableTarget="scrollable-container"
                        >
                            <div className="sell-boards-container">
                                {tradeBoards.map((board) => {
                                    let timeAgo = formatDistanceToNow(parseISO(board.createdDate), {
                                        addSuffix: true,
                                        locale: ko
                                    });

                                    return (
                                        <div key={board.id} className="sell-board">
                                            <Nav.Link href={`/boardDetail/${board.id}`}>
                                                <div className="sell-board-image">
                                                    <img
                                                        src={`https://storage.cloud.google.com/reboot-minty-storage/${board.thumbnail}`}
                                                        alt={board.title}
                                                        className="sell-board-image"
                                                        effect="opacity"
                                                    />
                                                </div>
                                                <div className="sell-board-tt">{board.title}</div>
                                                <div className="sell-board-p">{board.price.toLocaleString()} 원</div>
                                                <Row>
                                                    <Col>
                                                        <div className="sell-board-nn">
                                                            <span>🤍 {board.interesting}</span>
                                                        </div>
                                                    </Col>
                                                    <Col>
                                                        <div className="sell-board-cd">
                                                            <span>{timeAgo}</span>
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <div className="sell-board-ul">
                                                    <span> {board.sellArea}</span>
                                                </div>
                                            </Nav.Link>
                                        </div>
                                    );
                                })}
                            </div>
                        </InfiniteScroll>
                    ) : (
                        <div className="no-results-message">게시물이 없습니다.</div>
                    )}
                </Col>
            </Row>
            <Modal show={showUserLocationModal} onHide={handleUserLocationCloseModal} fullscreen={fullscreen}>
                <Modal.Header closeButton>
                    <Modal.Title>고객 위치 인증 리스트</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div ref={mapContainerRef} style={mapContainerStyle}></div>
                    <br/><br/>
                    <RangeSlider
                        value={mapLevel}
                        onChange={handleSliderChange}
                        step={50}
                        min={0}
                        max={100}
                        tooltip={false}
                        variant='info'
                    />
                    <br/><br/>

                    <Row className="userLocationList">
                        <Col md={11}>
                        <div className="col">
                            <ul className="list-group userLocation-list d-flex flex-row align-items-center flex-nowrap">
                                {userLocationList.map((result, index) => (
                                    <li key={index} className="list-group-item" style={{border: "1px solid grey"}}>
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            style={{textDecoration: "none", color: "grey"}}
                                            onClick={() => {
                                                handleAddressLinkClick(index)
                                            }}
                                        >
                                            {result.address}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            style={{textDecoration: "none", color: "grey", marginLeft: "5px"}}
                                            onClick={() => {
                                                handleDeleteLocation(index);
                                            }}
                                        >
                                            x
                                        </button>
                                    </li>
                                ))}
                                <li className="list-group-item" style={{border: "1px solid grey"}}>
                                    <button
                                        type="button"
                                        className="btn btn-link"
                                        style={{textDecoration: "none", color: "grey"}}
                                        onClick={() => {
                                            window.location.href = "/map";
                                        }}
                                    >
                                        +
                                    </button>
                                </li>
                            </ul>
                        </div>
                        </Col>
                    </Row>

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleUserLocationCloseModal}>
                        닫기
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
}

export default BoardList;