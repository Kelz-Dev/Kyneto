import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/bg04.png'
import crypto from '../assets/images/crypto.png'
import iconImg from '../assets/images/icon-gradient.png'

import Navbar from "../components/navbar";
import Charts from "../components/chart";
import RoadMap from '../components/roadMap';
import About from "../components/about";
import Client from '../components/client';
import FooterTop from '../components/footerTop';
import Footer from '../components/footer';

import { FiArrowRight, FiArrowRightCircle, FiVideo } from "../assets/icons/vander"
import { appLink } from "../data/data";

import ModalVideo from 'react-modal-video';
import '../../node_modules/react-modal-video/scss/modal-video.scss'

export default function Index() {
    let [isOpen, setOpen] = useState(false);
    let [days, setDays] = useState(0);
    let [hours, setHours] = useState(0);
    let [minutes, setMinutes] = useState(0);
    let [seconds, setSeconds] = useState(0);

    let deadline = "December, 31, 2024";

    let getTime = () => {
        let time = Date.parse(deadline) - Date.now();

        setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
        setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
        setMinutes(Math.floor((time / 1000 / 60) % 60));
        setSeconds(Math.floor((time / 1000) % 60));
    };

    useEffect(() => {
        let interval = setInterval(() => getTime(deadline), 1000);

        return () => clearInterval(interval);
    });
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />
            <section className="bg-half-260 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'center' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row mt-5">
                        <div className="col-12">
                            <div className="title-heading">
                                <h4 className="display-6 text-white fw-medium title-dark mb-4">The Future of <br /> Decentralized Storage</h4>
                                <p className="text-white-50 para-desc">Kyneto is a persistent, verifiable, and incentivized storage layer built on IPFS. Secure your data with cryptographic proofs.</p>

                                <div className="subcribe-form mt-4 pt-2">
                                    <form className="m-0" style={{ maxWidth: '550px' }}>
                                        <input type="text" id="course" name="name" className="rounded-lg bg-white opacity-4" placeholder="Search assets..." />
                                        <button type="submit" className="btn btn-pills btn-primary">Get Started</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-12">
                            <div className="features-absolute">
                                <Charts />
                            </div>

                            <div className="text-center mt-4">
                                <a href="http://kyneto.app:3003" target="_blank" rel="noreferrer" className="text-primary">View Marketplace <FiArrowRight /></a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <About />
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <img src={crypto} className="img-fluid d-block mx-auto" alt="" />
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {appLink.map((item, index) => {
                            let Icon = item.icon
                            return (
                                <div className="col-lg-2 col-md-3 col-6 mt-4 pt-2" key={index}>
                                    <Link to="#" className="apps-links bg-light mx-auto d-block text-center rounded py-3">
                                        <Icon className="icon text-dark h4" />
                                        <h6 className="fw-normal mb-0 app-name text-muted mt-2">{item.title}</h6>
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-4">Success Roadmap</h4>
                                <p className="text-muted mx-auto para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                            </div>
                        </div>
                    </div>

                    <RoadMap />
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-lg-5 col-md-7 col-12 order-2 order-md-1 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="card border-0 shadow rounded p-4 bg-light overflow-hidden">
                                <img src={iconImg} className="avatar avatar-md-md d-block mx-auto" alt="" />
                                <h5 className="text-center text-dark mt-3">Kyneto Protocol Launch</h5>
                                <div className="row">
                                    <div className="col-md-12 text-center">
                                        <div id="token-sale">
                                            <ul className="count-down list-unstyled m-0">
                                                <li id="days" className="count-number fw-medium mb-0 list-inline-item px-3">{days}<p className='count-head'>Days</p></li>
                                                <li id="hours" className="count-number fw-medium mb-0 list-inline-item px-3">{hours}<p className='count-head'>Hours</p></li>
                                                <li id="mins" className="count-number fw-medium mb-0 list-inline-item px-3">{minutes}<p className='count-head'>Mins</p></li>
                                                <li id="secs" className="count-number fw-medium mb-0 list-inline-item px-3">{seconds}<p className='count-head'>Secs</p></li>
                                                <li id="end" className="h1"></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-muted text-center">Mainnet launch countdown <span className="text-dark fw-medium">December 31st 2024</span></p>

                                <div className="progress-box mt-4">
                                    <div className="progress rounded-md" style={{ height: '16px' }}>
                                        <div className="progress-bar position-relative bg-gradient-primary rounded-md" style={{ width: '60%' }}>
                                            <div className="progress-value d-block text-muted h6">Funded 60% = $ 600000</div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between mt-2">
                                        <h6 className="title text-muted text-start mb-0">$ 1000</h6>
                                        <h6 className="title text-muted text-end mb-0">$ 1000000</h6>
                                    </div>
                                </div>

                                <ul className="list-unstyled mb-0 mt-4">
                                    <li className="h6 ms-0 mb-0"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Soft Cap:</span> &nbsp;10000 USD</li>
                                    <li className="h6 ms-0 my-2"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Min. transaction Amount:</span> &nbsp;1000 USD</li>
                                    <li className="h6 ms-0 mb-0"><FiArrowRightCircle className="text-primary align-middle fs-5 me-1" /><span className="text-muted">Target:</span> &nbsp;900000 USD</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-primary w-100">Join Now</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 offset-lg-1 col-md-5 col-12 order-1 order-md-2">
                            <div className="section-title">
                                <span className="badge bg-soft-success rounded-md">Sale tokens</span>
                                <h4 className="title mt-3 mb-4">The Kyneto Network is Growing!</h4>
                                <p className="text-muted para-desc mx-auto">Join a global network of storage providers and earn rewards for securing the world's data.</p>
                                <p className="text-muted para-desc mx-auto mb-0">Kyneto provides institutional-grade decentralized storage solutions with built-in verification and automated incentives.</p>
                                <div className="mt-4">
                                    <a href="http://kyneto.app:3003" target="_blank" rel="noreferrer" className="btn btn-primary">Token sale</a>
                                    <Link to="#" onClick={() => setOpen(true)} className="btn btn-icon btn-pills btn-primary m-1 lightbox"><FiVideo className="icons" /></Link><small className="fw-medium align-middle ms-1">Watch Now</small>
                                </div>
                                <ModalVideo
                                    channel="youtube"
                                    youtube={{ mute: 0, autoplay: 0 }}
                                    isOpen={isOpen}
                                    videoId="yba7hPeTSjk"
                                    onClose={() => setOpen(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Client />
            <FooterTop />
            <Footer />
        </>
    )
}