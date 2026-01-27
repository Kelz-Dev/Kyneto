import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import logoDark from '../assets/images/logo-dark.png'
import logoLight from '../assets/images/logo-light.png'
import logoIcon from '../assets/images/icon-gradient.png'

import Offcanvas from 'react-bootstrap/Offcanvas';


import { AiOutlineShoppingCart, RiDribbbleLine, FaBehance, FaLinkedin, FaFacebookF, FaInstagram, FaTwitter, FiMail, MdOutlineInsertDriveFile, LuUser2, FiUser, FiKey } from '../assets/icons/vander'

export default function Navbar({ headClass, navClass, navDark }) {
    let [scroll, setScroll] = useState(false)
    let [toggle, setToggle] = useState(false);
    let [manu, setManu] = useState('');
    let [subManu, setSubManu] = useState('');

    let [show, setShow] = useState(false);

    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
        let windowScroll = () => {
            setScroll(window.scrollY > 50)
        }
        window.addEventListener('scroll', windowScroll)

        let current = location.pathname
        setManu(current)
        setSubManu(current)

        return () => {
            window.removeEventListener('scroll', windowScroll)
        }
    }, [location.pathname])
    return (
        <>
            <header id="topnav" className={`${scroll ? 'nav-sticky' : ''} ${headClass}`}>
                <div className="container">
                    <Link className="logo" to="/">
                        <span className="logo-light-mode">
                            <img src={logoDark} className="l-dark" height="28" alt="" />
                            <img src={logoLight} className="l-light" height="28" alt="" />
                            <span className="ms-2 h5 text-dark fw-bold">Kyneto</span>
                        </span>
                        <img src={logoLight} height="28" className="logo-dark-mode" alt="" />
                        <span className="logo-dark-mode ms-2 h5 text-white fw-bold">Kyneto</span>
                    </Link>

                    <div className="menu-extras">
                        <div className="menu-item">
                            <Link to="#" className={`${toggle ? 'open' : ''} navbar-toggle`} id="isToggle" onClick={() => setToggle(!toggle)}>
                                <div className="lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <ul className="buy-button list-inline mb-0">
                        <li className="list-inline-item mb-0 me-1">
                            <a href="http://kyneto.app:3003" target="_blank" rel="noreferrer" className="btn btn-primary">Launch App</a>
                        </li>
                        <li className="list-inline-item search-icon mb-0">
                            <Link to="#" onClick={() => setShow(true)}>
                                <div className="btn btn-icon btn-pills btn-primary"><LuUser2 /></div>
                            </Link>
                        </li>
                        <Offcanvas show={show} onHide={() => setShow(false)} placement="end">
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title><h6 className="mb-0"> Kyneto</h6></Offcanvas.Title>
                            </Offcanvas.Header>
                            <Offcanvas.Body>
                                <form className="login-form">
                                    <div className="row">
                                        <div className="col-12">
                                            <img src={logoIcon} className="avatar avatar-large d-block mx-auto my-5" alt="" />
                                        </div>

                                        <div className="col-lg-12 mt-4">
                                            <div className="mb-3">
                                                <label className="form-label">Your Email <span className="text-danger">*</span></label>
                                                <div className="form-icon position-relative">
                                                    <FiUser className="fea icon-sm icons" />
                                                    <input type="email" className="form-control ps-5" placeholder="Email" name="email" required="" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-lg-12">
                                            <div className="mb-3">
                                                <label className="form-label">Password <span className="text-danger">*</span></label>
                                                <div className="form-icon position-relative">
                                                    <FiKey className="fea icon-sm icons" />
                                                    <input type="password" className="form-control ps-5" placeholder="Password" required="" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-lg-12">
                                            <div className="d-flex justify-content-between">
                                                <div className="mb-3">
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                                        <label className="form-check-label" htmlFor="flexCheckDefault">Remember me</label>
                                                    </div>
                                                </div>
                                                <small className="forgot-pass mb-0"><Link to="/reset-password" className="text-dark">Forgot password ?</Link></small>
                                            </div>
                                        </div>

                                        <div className="col-lg-12 mb-0">
                                            <div className="d-grid">
                                                <button className="btn btn-primary">Sign in</button>
                                            </div>
                                        </div>

                                        <div className="col-12 text-center mt-3">
                                            <small><small className="text-dark me-2">Don't have an account ?</small> <Link to="/signup" className="text-dark">Sign Up</Link></small>
                                        </div>
                                    </div>
                                </form>
                            </Offcanvas.Body>
                            <div className="offcanvas-footer p-4 text-center">
                                <ul className="list-unstyled social-icon social mb-0">
                                    <li className="list-inline-item"><Link to="#" className="rounded"><AiOutlineShoppingCart className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><RiDribbbleLine className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FaBehance className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FaLinkedin className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FaFacebookF className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FaInstagram className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FaTwitter className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><FiMail className="align-middle" /></Link></li>
                                    <li className="list-inline-item"><Link to="#" className="rounded"><MdOutlineInsertDriveFile className="align-middle" /></Link></li>
                                </ul>
                            </div>
                        </Offcanvas>

                    </ul>

                    <div id="navigation" style={{ display: toggle ? 'block' : 'none' }}>
                        <ul className={navClass}>
                            <li className={`has-submenu parent-menu-item ${["/", "/index", "/index-two", "/index-three", "/index-four", "/index-five", "/index-six"].includes(manu) ? 'active' : ''}`}>
                                <Link to="#" onClick={() => setSubManu(subManu === "index-item" ? "" : "index-item")}>Home</Link><span className="menu-arrow"></span>
                                <ul className={`submenu ${["", "/index", "/index-two", "/index-three", "/index-four", "/index-five", "/index-six", "index-item"].includes(subManu) ? 'open' : ''}`}>
                                    <li className={manu === "/index" ? 'active' : ''}><Link to="/index" className="sub-menu-item">Hero One</Link></li>
                                    <li className={manu === "/index-two" ? 'active' : ''}><Link to="/index-two" className="sub-menu-item">Hero Two</Link></li>
                                    <li className={manu === "/index-three" ? 'active' : ''}><Link to="/index-three" className="sub-menu-item">Hero Three</Link></li>
                                    <li className={manu === "/index-four" ? 'active' : ''}><Link to="/index-four" className="sub-menu-item">Hero Four</Link></li>
                                    <li className={manu === "/index-five" ? 'active' : ''}><Link to="/index-five" className="sub-menu-item">Hero Five </Link></li>
                                    <li className={manu === "/index-six" ? 'active' : ''}><Link to="/index-six" className="sub-menu-item">Hero Six </Link></li>
                                </ul>
                            </li>

                            <li className={manu === "/market-price" ? 'active' : ''}><Link to="/market-price" className="sub-menu-item">Market</Link></li>
                            <li className={manu === "/token" ? 'active' : ''}><Link to="/token" className="sub-menu-item"> Token</Link></li>
                            <li className={manu === "/ico-listing" ? 'active' : ''}><Link to="/ico-listing" className="sub-menu-item">ICO Listing</Link></li>
                            <li className={manu === "/crypto-wallets" ? 'active' : ''}><Link to="/crypto-wallets" className="sub-menu-item">Wallets</Link></li>

                            <li className={`has-submenu parent-parent-menu-item ${["/aboutus", "/features", "/team", "/roadmap", "/mission", "/career", "/whitepaper", "/help-faqs", "/help-overview", "/help-guides", "/help-support", "/blog", "/blog-detail", "/login", "/signup", "/reset-password", "/comingsoon", "/error", "/contact"].includes(manu) ? 'active' : ''}`}>
                                <Link to="#" onClick={() => setSubManu(subManu === 'page-item' ? '' : 'page-item')}>Pages</Link><span className="menu-arrow"></span>
                                <ul className={`submenu ${["/aboutus", "/features", "/team", "/roadmap", "/mission", "/career", "/whitepaper", "/help-faqs", "/help-overview", "/help-guides", "/help-support", "/blog", "/blog-detail", "/login", "/signup", "/reset-password", "/comingsoon", "/error", "/contact", "page-item", 'help-item', 'blog-item', 'auth-item'].includes(subManu) ? 'open' : ''}`}>
                                    <li className={manu === "/aboutus" ? 'active' : ''}><Link to="/aboutus" className="sub-menu-item"> About Us</Link></li>
                                    <li className={manu === "/features" ? 'active' : ''}><Link to="/features" className="sub-menu-item"> Features</Link></li>
                                    <li className={manu === "/team" ? 'active' : ''}><Link to="/team" className="sub-menu-item"> Team</Link></li>
                                    <li className={manu === "/roadmap" ? 'active' : ''}><Link to="/roadmap" className="sub-menu-item"> Roadmap</Link></li>
                                    <li className={manu === "/mission" ? 'active' : ''}><Link to="/mission" className="sub-menu-item"> Mission</Link></li>
                                    <li className={manu === "/career" ? 'active' : ''}><Link to="/career" className="sub-menu-item"> Career</Link></li>
                                    <li className={manu === "/whitepaper" ? 'active' : ''}><Link to="/whitepaper" className="sub-menu-item">Whitepaper </Link></li>
                                    <li className={`has-submenu parent-menu-item ${["/help-faqs", "/help-overview", "/help-guides", "/help-support"].includes(manu) ? 'active' : ''}`}><Link to="#" onClick={() => setSubManu(subManu === 'help-item' ? '' : 'help-item')}> Help Centers</Link><span className="submenu-arrow"></span>
                                        <ul className={`submenu ${["/help-faqs", "/help-overview", "/help-guides", "/help-support", 'help-item'].includes(subManu) ? 'open' : ''}`}>
                                            <li className={manu === "/help-faqs" ? 'active' : ''}><Link to="/help-faqs" className="sub-menu-item">FAQs </Link></li>
                                            <li className={manu === "/help-overview" ? 'active' : ''}><Link to="/help-overview" className="sub-menu-item">Overview</Link></li>
                                            <li className={manu === "/help-guides" ? 'active' : ''}><Link to="/help-guides" className="sub-menu-item">Guides</Link></li>
                                            <li className={manu === "/help-support" ? 'active' : ''}><Link to="/help-support" className="sub-menu-item">Support</Link></li>
                                        </ul>
                                    </li>
                                    <li className={`has-submenu parent-menu-item ${["/blog", "/blog-detail"].includes(manu) ? 'active' : ''}`}><Link to="#" onClick={() => setSubManu(subManu === 'blog-item' ? '' : 'blog-item')}> Blog </Link><span className="submenu-arrow"></span>
                                        <ul className={`submenu ${["/blog", "/blog-detail", 'blog-item'].includes(subManu) ? 'open' : ''}`}>
                                            <li className={manu === "/blog" ? 'active' : ''}><Link to="/blog" className="sub-menu-item"> Blog </Link></li>
                                            <li className={manu === "/blog-detail" ? 'active' : ''}><Link to="/blog-detail" className="sub-menu-item">Blog Detail</Link></li>
                                        </ul>
                                    </li>
                                    <li className={`has-submenu parent-menu-item ${["/login", "/signup", "/reset-password"].includes(manu) ? 'active' : ''}`}><Link to="#" onClick={() => setSubManu(subManu === 'auth-item' ? '' : 'auth-item')}> Auth pages </Link><span className="submenu-arrow"></span>
                                        <ul className={`submenu ${["/login", "/signup", "/reset-password", 'auth-item'].includes(subManu) ? 'open' : ''}`}>
                                            <li><Link to="/login" className="sub-menu-item">Login</Link></li>
                                            <li><Link to="/signup" className="sub-menu-item">Signup</Link></li>
                                            <li><Link to="/reset-password" className="sub-menu-item">Reset Password</Link></li>
                                        </ul>
                                    </li>
                                    <li><Link to="/comingsoon" className="sub-menu-item">Comingsoon</Link></li>
                                    <li><Link to="/error" className="sub-menu-item">Error 404!</Link></li>
                                    <li><Link to="/contact" className="sub-menu-item">Contact Us</Link></li>
                                </ul>
                            </li>
                            <li><Link to="/index-nft" target="_blank" className="sub-menu-item"> NFT Market</Link></li>
                        </ul>
                    </div>
                </div>
            </header>
        </>
    )
}