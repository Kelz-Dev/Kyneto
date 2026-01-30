import React, { useEffect, useState } from "react";
import { Link, useLocation  } from "react-router-dom";

import logoDark from '../assets/images/icon-dark.png'
import logoLight from '../assets/images/icon-light.png'
import client from '../assets/images/client/01.jpg'

import {LuSearch} from '../assets/icons/vander'

import Offcanvas from 'react-bootstrap/Offcanvas';

export default function Navbar({headClass, navClass}){
    let [ scroll, setScroll ] = useState(false)
    let [ toggle, setToggle] = useState(false);
    let [manu , setManu] = useState('');
    let [subManu , setSubManu] = useState('');

    let [show, setShow] = useState(false);

    const location = useLocation();

    useEffect(()=>{
        window.scrollTo( 0, 0 );
        let windowScroll =()=>{
            setScroll(window.scrollY > 50)
        }
        window.addEventListener('scroll', windowScroll )

        let current = location.pathname
        setManu(current)
        setSubManu(current)

        return()=>{
            window.removeEventListener('scroll', windowScroll )
        }
    },[location.pathname])

    return(
        <header id="topnav" className={`${scroll ? 'nav-sticky' : '' } ${headClass}`}>
            <div className="container">
                <Link className="logo" to="/index">
                    <img src={logoDark} height="40" className="logo-light-mode" alt=""/>
                    <img src={logoLight} height="40" className="logo-dark-mode" alt=""/>
                </Link>

                <div className="menu-extras">
                    <div className="menu-item">
                        <Link to="#" className={`${ toggle ? 'open' : '' } navbar-toggle`} id="isToggle" onClick={() =>setToggle(!toggle)}>
                            <div className="lines">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </Link>
                    </div>
                </div>

                <ul className="buy-button list-inline mb-0">
                    <li className="list-inline-item search-icon mb-0">
                        <Link to="#" onClick={() =>setShow(true)} aria-controls="offcanvasTop">
                            <LuSearch className="fs-5 align-middle text-dark mb-0"/>
                        </Link>
                    </li>
                    <Offcanvas show={show} onHide={() =>setShow(false)} placement="top">
                        <Offcanvas.Body>
                            <div className="container py-4">
                                <div className="row">
                                    <div className="col">
                                        <div className="text-center">
                                            <h4>Search now.....</h4>
                                            <div className="subcribe-form mt-4">
                                                <form>
                                                    <div className="mb-0">
                                                        <input type="text" id="help" name="name" className="border bg-white rounded-pill" required="" placeholder="Search anything..."/>
                                                        <button type="submit" className="btn btn-pills btn-primary">Search</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Offcanvas.Body>
                    </Offcanvas>

                    <li className="list-inline-item ms-2">
                        <Link to="/nft-creator-profile"><img src={client} className="rounded-pill avatar avatar-sm-sm" alt=""/></Link>
                    </li>
                </ul>
        
                <div id="navigation" style={{ display: toggle ? 'block' : 'none' }}>
                    <ul className={navClass}>

                        <li className={`has-submenu parent-menu-item ${["/index-nft", "/index-nft-two", "/index-nft-three", "/index-nft-four", "/index-nft-five"].includes(manu) ? 'active' : ''}`}>
                            <Link to="#" onClick={() =>setSubManu(subManu === "nft-index-item" ? "" : "nft-index-item")}>Demos</Link><span className="menu-arrow"></span>
                            <ul className={`submenu ${["/index-nft", "/index-nft-two", "/index-nft-three", "/index-nft-four", "/index-nft-five", "nft-index-item"].includes(subManu) ? 'open' : '' }`}>
                                <li className={manu === "/index-nft" ? 'active' : ''}><Link to="/index-nft" className="sub-menu-item">NFT One</Link></li>
                                <li className={manu === "/index-nft-two" ? 'active' : ''}><Link to="/index-nft-two" className="sub-menu-item">NFT Two</Link></li>
                                <li className={manu === "/index-nft-three" ? 'active' : ''}><Link to="/index-nft-three" className="sub-menu-item">NFT Three</Link></li>
                                <li className={manu === "/index-nft-four" ? 'active' : ''}><Link to="/index-nft-four" className="sub-menu-item">NFT Four </Link></li>
                                <li className={manu === "/index-nft-five" ? 'active' : ''}><Link to="/index-nft-five" className="sub-menu-item">NFT Five </Link></li>
                            </ul>
                        </li>

                        <li className={manu === "/nft-faqs" ? 'active' : ''}><Link to="/nft-faqs" className="sub-menu-item">How it works!</Link></li>
        
                        <li className={`has-submenu parent-menu-item ${["/nft-creators", "/nft-creator-profile", "/nft-creator-setting", "/nft-become-creator"].includes(manu) ? 'active' : ''}`}>
                            <Link to="#" onClick={() =>setSubManu(subManu === "creator-item" ? "" : "creator-item")}>Creator</Link><span className="menu-arrow"></span>
                            <ul className={`submenu ${["/nft-creators", "/nft-creator-profile", "/nft-creator-setting", "/nft-become-creator", "creator-item"].includes(subManu) ? 'open' : '' }`}>
                                <li className={manu === "/nft-creators" ? 'active' : ''}><Link to="/nft-creators" className="sub-menu-item"> Creators</Link></li>
                                <li className={manu === "/nft-creator-profile" ? 'active' : ''}><Link to="/nft-creator-profile" className="sub-menu-item"> Creator Profile</Link></li>
                                <li className={manu === "/nft-creator-setting" ? 'active' : ''}><Link to="/nft-creator-setting" className="sub-menu-item"> Creator Settings</Link></li>
                                <li className={manu === "/nft-become-creator" ? 'active' : ''}><Link to="/nft-become-creator" className="sub-menu-item"> Become Creator</Link></li>
                            </ul>
                        </li>
                        
                        <li className={`has-submenu parent-menu-item ${["/nft-explore", "/nft-collection", "/nft-item-detail"].includes(manu) ? 'active' : ''}`}>
                            <Link to="#" onClick={() =>setSubManu(subManu === "explore-item" ? "" : "explore-item")}>Explore</Link><span className="menu-arrow"></span>
                            <ul className={`submenu ${["/nft-explore", "/nft-collection", "/nft-item-detail", "explore-item"].includes(subManu) ? 'open' : '' }`}>
                                <li className={manu === "/nft-explore" ? 'active' : ''}><Link to="/nft-explore" className="sub-menu-item"> Explore</Link></li>
                                <li className={manu === "/nft-collection" ? 'active' : ''}><Link to="/nft-collection" className="sub-menu-item"> Collections</Link></li>
                                <li className={manu === "/nft-item-detail" ? 'active' : ''}><Link to="/nft-item-detail" className="sub-menu-item">Item Detail</Link></li>
                            </ul>
                        </li>
                        <li className={manu === "/nft-upload-work" ? 'active' : ''}><Link to="/nft-upload-work" className="sub-menu-item">Upload Works</Link></li>
                        <li><Link to="/index" target="_blank" className="sub-menu-item">Crypto</Link></li>
                    </ul>
                </div>
            </div>
        </header>
    )
}