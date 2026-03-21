import React from "react";
import { Link } from "react-router-dom";

import logoLight from '../assets/images/kyneto-logo-real.png'
import iconImg from '../assets/images/kyneto-logo-real.png'

import { AiOutlineShoppingCart, RiDribbbleLine, FaBehance, FaLinkedin, FaFacebookF, FaInstagram, FaTwitter, FiMail, MdOutlineInsertDriveFile, FiChevronRight, FiArrowUp, TbHeartFilled } from '../assets/icons/vander'

export default function Footer() {

    const topFunction = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };
    return (
        <footer className="bg-footer">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="footer-py-100 footer-border-top">
                            <div className="row">
                                <div className="col-lg-4 col-12 mb-0 mb-md-4 pb-0 pb-md-2">
                                    <Link to="#" className="logo-footer">
                                        <img src={logoLight} height="28" alt="" />
                                    </Link>
                                    <p className="text-foot mt-4">With Kyneto, your data is secured by the next generation of decentralized storage protocols.</p>
                                    <ul className="list-unstyled social-icon foot-social-icon mb-0 mt-4">
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><AiOutlineShoppingCart className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><RiDribbbleLine className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FaBehance className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FaLinkedin className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FaFacebookF className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FaInstagram className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FaTwitter className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiMail className="align-middle" /></Link></li>
                                        <li className="list-inline-item"><Link to="#" className="rounded" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><MdOutlineInsertDriveFile className="align-middle" /></Link></li>
                                    </ul>
                                </div>

                                <div className="col-lg-2 col-md-4 col-12 mt-4 mt-sm-0 pt-2 pt-sm-0">
                                    <h5 className="text-light footer-head">Company</h5>
                                    <ul className="list-unstyled footer-list mt-4">
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />About</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Marketplace</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Sell Token</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Team</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Roadmap</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Mission</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Whitepaper</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />News</Link></li>
                                        <li><Link to="#" className="text-foot" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}><FiChevronRight className="me-1" />Contact Us</Link></li>
                                    </ul>
                                </div>

                                {/* <div className="col-lg-2 col-md-4 col-12 mt-4 mt-sm-0 pt-2 pt-sm-0">
                                    <h5 className="text-light footer-head">NFT Market</h5>
                                    <ul className="list-unstyled footer-list mt-4">
                                        <li><Link to="/index-nft" className="text-foot"><FiChevronRight className="me-1"/>NFTs</Link></li>
                                        <li><Link to="/nft-explore" className="text-foot"><FiChevronRight className="me-1"/>Explores</Link></li>
                                        <li><Link to="/nft-collection" className="text-foot"><FiChevronRight className="me-1"/>Collections</Link></li>
                                        <li><Link to="/nft-creators" className="text-foot"><FiChevronRight className="me-1"/>Creators</Link></li>
                                        <li><Link to="/nft-faqs" className="text-foot"><FiChevronRight className="me-1"/>How It Works</Link></li>
                                    </ul>
                                </div> */}

                                <div className="col-lg-4 col-md-4 col-12 mt-4 mt-sm-0 pt-2 pt-sm-0">
                                    <h5 className="text-light footer-head">Start hosting with Kyneto</h5>

                                    <ul className="list-unstyled footer-list mt-4 mb-2">
                                        <li className="list-inline-item mx-1"><Link to="#" className="btn btn-soft-primary" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}>Signin</Link></li>
                                        <li className="list-inline-item mx-1"><Link to="#" className="btn btn-primary" style={{ cursor: 'default', opacity: 0.6, pointerEvents: 'none' }}>Signup</Link></li>
                                    </ul>
                                    <small className="text-foot d-block">Institutional Investor? <Link to="#" className="text-foot fw-medium">Learn More</Link></small>

                                    <img src={iconImg} className="avatar avatar-medium mt-4" alt="" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-py-30 footer-border-top">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-sm-8">
                            <div className="text-sm-start text-center">
                                <p className="mb-0 text-foot">© {new Date().getFullYear()} Kyneto. Design & Develop with <TbHeartFilled className="text-danger" /> by <Link to="https://shreethemes.in/" target="_blank" className="text-reset">Shreethemes</Link>.</p>
                            </div>
                        </div>

                        <div className="col-sm-4 mt-4 mt-sm-0">
                            <div className="text-sm-end text-center">
                                <Link to="#" onClick={topFunction} id="back-to-top" className="btn btn-pills btn-icon btn-primary back-to-top"><FiArrowUp className="icons" /></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}