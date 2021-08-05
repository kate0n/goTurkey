import React, { useState, useEffect } from "react";
import cx from "classnames";
import useRouter from "use-react-router";
import ReactPaginate from "react-paginate";
import { useWindowSize, useLockBodyScroll } from "react-use";

import {getGetPackages, getDurationList, getOriginList} from "./apiQueries";
import {
	BreadCrumbs,
	Icons,
	FilterPopup,
	HotelsFilter,
	getHotelsArr,
} from "../components/export";

export const HotelsList = () => {
	const className = "hotels";
	const { history } = useRouter();
	const { width } = useWindowSize();
	const isMobile = width <= 580;

	const [originList, setOriginList] = useState([{ title: "", id: "", city_code: "" }]);
	useEffect(() => {
		getOriginList().then(
			(response) => {
				const originListData = [];
				response['origin-list'].active.forEach((listItem, i) => {
					originListData.push({
						title: listItem,
						id: i + 1,
						city_code: "RIX"
					})
				});
				setOriginList(originListData);
			},
			(error) => {
				console.error("Error getting origin list", error);
			},
		);
	}, []);

	const [durations, setDurations] = useState([0]);
	useEffect(() => {
		getDurationList().then(
			(response) => {
				setDurations(response['duration-list']);
			},
			(error) => {
				console.error("Error getting durations data", error);
			},
		);
	}, []);

	const bookingDataLS = JSON.parse(localStorage.getItem("bookingData")) || {
		origin: originList[0],
		destination: {
			title: 'Turkey',
			id: 2,
			city_code: "RIX"
		},
		duration: 7,
		date: {
			date: new Date(),
			dateInterval: 5,
		},
		travellers: {
			adults: 2,
			children: 1,
		},
		travellersValues: {
			adults: new Array(Number(2)).fill({}),
			children: new Array(Number(1)).fill({}),
		},
	};

	const [filterActiveTab, setFilterActiveTab] = useState(false);
	const [filterState, setFilterState] = useState(bookingDataLS);
	useLockBodyScroll(isMobile && filterActiveTab);

	useEffect(() => {
		const bookingDataLSNew = bookingDataLS;
		bookingDataLSNew.origin = originList[0];
		setFilterState(bookingDataLSNew);
	}, [originList]);

	useEffect(() => {
		const bookingDataLSNew = bookingDataLS;
		bookingDataLSNew.duration = durations[0];
		setFilterState(bookingDataLSNew);
	}, [durations]);

	const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
	const handleTabClick = ({ tab, value }) => {
		if (tab?.key === filterActiveTab) {
			setFilterActiveTab(false);
			isMobile && setIsFilterPopupOpen(false);
		} else {
			setFilterActiveTab(tab?.key);
			isMobile && setIsFilterPopupOpen(true);
		}

		if (value) {
			let newState = { ...filterState };
			newState[tab.key] = value;
			setFilterState(newState);
			localStorage.setItem("bookingData", JSON.stringify(newState));
			console.log("filterState", tab, newState);
		}
	};

	const layouts = {
		lines: {
			name: "lines",
			hotelsPerPage: 5,
		},
		squares: {
			name: "squares",
			hotelsPerPage: width <= 480 ? 3 : 10,
		},
	};
	const [layout, setLayout] = useState(layouts.lines);

	const [page, setPage] = useState(1);
	const [hotels, setHotels] = useState([]);
	const [hotelsPage, setHotelsPage] = useState([]);
	const pagesCount = Math.ceil(hotels?.length / layout.hotelsPerPage);

	const sliceHotelsArr = ({ hotels, page = 1 }) => {
		const hotelsCount = page * layout.hotelsPerPage;
		const startIndex = page === 1 ? 0 : hotelsCount - layout.hotelsPerPage;
		const hotelsPage = hotels.slice(
			startIndex,
			startIndex + layout.hotelsPerPage,
		);
		setHotelsPage(hotelsPage);

		console.log(
			"page",
			page,
			"hotelsCount",
			hotelsCount,
			"startIndex,endIndex ",
			startIndex,
			startIndex + layout.hotelsPerPage,
			hotelsPage,
		);
	};

	const handlePageChange = ({ selected }) => {
		const newPage = selected + 1;
		setPage(selected + 1);
		sliceHotelsArr({ hotels, page: newPage });
	};

	const getFormatDate = (date) => {
		return `${date.getFullYear()}-` +
		`${(date.getMonth() + 1) < 10 ? ('0' + (date.getMonth() + 1)) : date.getMonth()}-` +
		`${date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()}`
	};

	// клик по карточке
	const handleHotelCardClick = ({ hotel }) => {
		const link = `/hotel-details/${hotel.id}`;
		history.push(link);

		localStorage.setItem(
			"hotelDetailsPageData",
			JSON.stringify(hotel),
		);

		localStorage.setItem(
			"bookingData",
			JSON.stringify({ ...bookingDataLS, hotel }),
		);
	};

	useEffect(() => {
		const beginDate = new Date(filterState.date.date);
		const beginDateFormat = getFormatDate(beginDate)

		let endDate = new Date();
		endDate.setDate(beginDate.getDate() + filterState.duration);
		const endDateFormat = getFormatDate(endDate);

		// запрос списка отелей
		const data = JSON.stringify({
			beginDate: beginDateFormat,
			endDate: endDateFormat,
			beginNight: filterState.duration,
			endNight: filterState.duration,
			adultNum: filterState.travellers.adults,
			kidNum: filterState.travellers.children
		});

		getGetPackages(data).then(
			(response) => {
				console.log('hotelsList response',response)
				const keys = Object.keys(response);
				const hotelsList = response[keys[0]];
				if (typeof hotelsList !== 'string') {
					hotelsList.forEach((hotelItem, i) => {
						hotelItem.id = i + 1;
					});
					setHotels(hotelsList);
					localStorage.setItem('hotelListData', JSON.stringify(hotelsList));
					sliceHotelsArr({ hotels: hotelsList, page });
				}
			},
			(error) => {
				console.error("Error while geocoding", error);
			},
		);
	}, [filterState]);

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [page]);

	return (
		<div className={`container-s ${className}`}>
			<FilterPopup isOpen={isFilterPopupOpen}>
				<HotelsFilter
					originList={originList}
					durations={durations}
					filterState={filterState}
					activeTabKey={filterActiveTab}
					handleTabClick={handleTabClick}
				/>
			</FilterPopup>

			{/* хлебные крошки */}
			<BreadCrumbs>
				<div className={`${className}-header_layout`}>
					<Icons.Square
						onClick={() => {
							setFilterActiveTab(false);
							setLayout(layouts.squares);
						}}
						fill={layout.name === "squares" ? "#ED1C24" : "#E7E7E7"}
						className={`${className}-header_layout_squares`}
					/>
					<Icons.Lines
						onClick={() => {
							setFilterActiveTab(false);
							setLayout(layouts.lines);
						}}
						fill={layout.name === "lines" ? "#ED1C24" : "#E7E7E7"}
						className={`${className}-header_layout_lines`}
					/>
				</div>
			</BreadCrumbs>

			{/* список фильтров */}
			<HotelsFilter
				originList={originList}
				durations={durations}
				filterState={filterState}
				activeTabKey={isMobile ? false : filterActiveTab}
				handleTabClick={handleTabClick}
			/>

			{/* затеменение фона */}
			{filterActiveTab && !isMobile && (
				<div className={`${className}-overlay`} />
			)}

			{/* карточки  */}
			<div className={`${className}-list`}>
				{hotelsPage.map((hotel, i) => {
					return (
						<HotelCard
							handleHotelCardClick={() => handleHotelCardClick({ hotel })}
							hotel={hotel}
							row={layout.name === "lines"}
							key={i}
						/>
					);
				})}
			</div>

			{/* пагинация */}
			<div className={`${className}-pagination`}>
				<ReactPaginate
					previousLabel={
						<Icons.PaginationArrow
							className={`${className}-pagination_arrow-left`}
						/>
					}
					nextLabel={
						<Icons.PaginationArrow
							className={`${className}-pagination_arrow-right`}
						/>
					}
					breakLabel={"..."}
					pageCount={pagesCount}
					marginPagesDisplayed={1}
					pageRangeDisplayed={2}
					onPageChange={handlePageChange}
					containerClassName={"pagination"}
					pageClassName={"pagination_page"}
					activeClassName='pagination_page--active'
					previousClassName='pagination_prev'
					nextClassName='pagination_next'
				/>
			</div>
		</div>
	);
};

export default HotelsList;

const HotelCard = ({ hotel, row, handleHotelCardClick }) => {
	const className = "hotels-list_card";
	const dateFrom = new Date(hotel['FlightDate']);
	const dateFromFormat = `${dateFrom.getDate()}.${
		(dateFrom.getMonth() + 1) < 10
			? '0' + (dateFrom.getMonth() + 1)
			: dateFrom.getMonth() + 1
	}`;
	const dateTo = new Date(hotel['BackFlightDate']);
	const dateToFormat = `${dateTo.getDate()}.${
		(dateTo.getMonth() + 1) < 10
			? '0' + (dateTo.getMonth() + 1)
			: dateTo.getMonth() + 1
	}`;
	const date = `${dateFromFormat} - ${dateToFormat}`;

	return (
		<div
			onClick={handleHotelCardClick}
			className={cx(className, {
				"hotels-list_card-row": row,
				"hotels-list_card-col": !row,
			})}>
			<img className={`${className}-img`} src={hotel['title-image']} alt='hotel preview' />
			<div className={`${className}-content`}>
				<div className={`${className}-content_top`}>
					<h3 className={`${className}-title`}>{`${hotel['HotelName']}`}</h3>
					<p className={`${className}-subtitle`}> {hotel['location-text']} </p>
				</div>

				<div className={`${className}-content_bottom`}>
					<p className={`${className}-date`}>{date}</p>
					<p className={`${className}-price`}>{hotel['PackagePrice']}$</p>
				</div>
			</div>
		</div>
	);
};
