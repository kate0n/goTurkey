import React from "react";
import { Link } from "react-router-dom";
import useRouter from "use-react-router";
import cx from "classnames";

import Logo from "../../assets/lastmin-logo.svg";

const Footer = () => {
	const { history } = useRouter();
	const isMain = history.location.pathname === "/";
	return (
		<footer
			className={cx("footer", {
				"footer--main": isMain,
			})}>
			<Link to='/'>
				<img className='footer-logo' src={Logo} alt='logo' />
			</Link>

			<div className='row-bw-center footer-contacts'>
				<a className='footer-phone' href='tel:+37120027785'>
					+371 20 027 785
				</a>
				<a className='footer-email' href='maiilto:info@lastmin.lv'>
					info@lastmin.lv
				</a>
			</div>

			<p className='footer-rights'>All rights reserved</p>
			<p className='footer-year'>2021</p>
		</footer>
	);
};

export default Footer;
