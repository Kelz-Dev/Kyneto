import React,{useState} from "react";
import { Link, useParams } from "react-router-dom";

import nft1 from '../assets/images/nft/625/1.jpg'

import client1 from '../assets/images/client/01.jpg'
import client2 from '../assets/images/client/02.jpg';

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

import { workData } from "../data/nftdata";

import { FiArrowRight } from '../assets/icons/vander'

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

import Modal from 'react-bootstrap/Modal';

export default function NftItemDetails(){
    const [show, setShow] = useState(false);
    const [show2, setShow2] = useState(false);

    const settings = {
        container: '.tiny-five-item',
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 5
            },

            767: {
                items: 3
            },

            320: {
                items: 1
            },
        },
      };

    let params = useParams();
    let id = params.id;
    let data = workData.find((item) =>item.id === parseInt(id))
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>
        <section className="section">
            <div className="container">
                <div className="row mt-5">
                    <div className="col-md-5">
                        <div className="position-relative">
                            <img src={data?.image2 ? data.image2 : nft1} className="img-fluid rounded-md shadow-md" alt=""/> 
                           

                            <div className="position-absolute top-0 start-0 mt-3 ms-3">
                                <span className="badge bg-primary">NFT</span>
                                <span className="badge bg-success mx-1">Art</span>
                                <span className="badge bg-warning">Digital</span>
                            </div>
                        </div>
                        <div className="bg-light rounded-md shadow mt-4 p-4">
                            <div>
                                <span className="fw-medium text-dark d-block mb-1">Contract Address :</span>
                                <Link to="" className="fw-medium text-decoration-underline d-block">1fsvtgju51ntgeryo9n3r3er246</Link>
                            </div>
                            
                            <div className="mt-4">
                                <span className="fw-medium text-dark d-block mb-1">Token ID :</span>
                                <span className="fw-medium d-block">458342529342930944</span>
                            </div>
                            
                            <div className="mt-4">
                                <span className="fw-medium text-dark d-block mb-1">Blockchain :</span>
                                <span className="fw-medium d-block">ETH</span>
                            </div>
                            
                            <div className="mt-4">
                                <span className="fw-medium text-dark d-block mb-1">Deposit & Withdraw :</span>
                                <span className="fw-medium d-block">Unsupported</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-7 mt-4 mt-sm-0 pt-2 pt-sm-0">
                        <div className="ms-lg-4">
                            <h4>{data?.title ? data.title : 'The future of ETH'}</h4>
                            <span className="badge rounded-pill bg-soft-primary">0.75ETH</span>

                            <p className="text-muted mt-4">If the distribution of letters and 'words' is random, the reader will not be distracted from making a neutral judgement on the visual impact and readability of the typefaces.</p>

                            <p className="text-muted mt-4">Our approach is to develop and promote widely accessible products that support economic freedom. For example, our digital wallet - which has 16 million downloads - provides people with an easy-to-use, non-custodial method for buying, selling, storing, sending, receiving, and trading cryptocurrencies.</p>

                            <div className="mt-4">
                                <span className="fs-5 text-muted  d-block">Market Price</span>
                                <span className="fs-4 fw-semibold text-dark d-block mt-2"><i className="mdi mdi-ethereum"></i> 3.5 ETH = $ 4,659.75</span>
                            </div>

                            <div className="col-12 mt-3 pt-2">
                                <Link to="#" className="btn btn-l btn-pills btn-primary me-2 mt-2" onClick={() =>setShow(true)} ><i className="mdi mdi-gavel fs-5 me-2"></i> Place a Bid</Link>
                                <Link to="#" className="btn btn-l btn-pills btn-primary mt-2" onClick={() =>setShow2(true)}><i className="mdi mdi-cart fs-5 me-2"></i> Buy Now</Link>
                            </div>
                            <Modal
                                show={show}
                                onHide={() =>setShow(false)}
                                backdrop="static"
                                keyboard={false}
                                centered
                            >
                                <Modal.Header closeButton>
                                <Modal.Title><h5 className="modal-title" id="bidtitle">Place a Bid</h5></Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <form>
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold">Your Bid Price <span className="text-danger">*</span></label>
                                                    <input name="name" id="name" type="text" className="form-control" placeholder="00.00 ETH"/>
                                                    <small className="text-muted"><span className="text-dark">Note:</span> Bid price at least 1 ETH</small>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold">Enter Your QTY <span className="text-danger">*</span></label>
                                                    <input name="email" id="email" type="email" className="form-control" placeholder="0"/>
                                                    <small className="text-muted"><span className="text-dark">Note:</span> Max. Qty 5</small>
                                                </div> 
                                            </div>
                                        </div>
                                    </form>

                                    <div className="pt-3 border-top">
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> You must bid at least:</p>
                                            <p className="text-primary"> 1.22 ETH </p>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> Service free:</p>
                                            <p className="text-primary"> 0.05 ETH </p>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> Total bid amount:</p>
                                            <p className="text-primary mb-0"> 1.27 ETH </p>
                                        </div>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Link to="" className="btn btn-pills btn-primary"><i className="mdi mdi-basket-plus fs-5 me-2"></i> View Your Bid</Link>
                                </Modal.Footer>
                            </Modal>
                            <Modal
                                show={show2}
                                onHide={() =>setShow2(false)}
                                backdrop="static"
                                keyboard={false}
                                size="md"
                                centered
                            >
                                <Modal.Header closeButton>
                                <Modal.Title><h5 className="modal-title" id="buyNft">Checkout</h5></Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <form>
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold">Your Price <span className="text-danger">*</span></label>
                                                    <input name="name2" id="name2" type="text" className="form-control" defaultValue="1.5ETH"/>
                                                </div>
                                            </div>
                                        </div>
                                    </form>

                                    <div className="py-3 border-top">
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> You must bid at least:</p>
                                            <p className="text-primary"> 1.22 ETH </p>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> Service free:</p>
                                            <p className="text-primary"> 0.05 ETH </p>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <p className="fw-bold small"> Total bid amount:</p>
                                            <p className="text-primary mb-0"> 1.27 ETH </p>
                                        </div>
                                    </div>

                                    <div className="bg-soft-danger p-3 rounded shadow">
                                        <div className="d-flex align-items-center">
                                            <i className="uil uil-exclamation-circle h2 mb-0 me-2"></i>
                                            <div className="flex-1">
                                                <h6 className="mb-0">This creator is not verified</h6>
                                                <small className="mb-0">Purchase this item at your own risk</small>
                                            </div>
                                        </div>
                                    </div>
                        
                                    <div className="mt-4">
                                        <button className="btn btn-pills btn-primary w-100" data-bs-target="#buyNftSuccess" data-bs-toggle="modal"><i className="mdi mdi-cart fs-5 me-2"></i> Continue</button>
                                        <form>
                                            <div className="form-check align-items-center d-flex mt-2">
                                                <input className="form-check-input mt-0" type="checkbox" readOnly="" id="AcceptT&C"/>
                                                <label className="form-check-label text-muted ms-2" for="AcceptT&C">I Accept <Link to="#" className="text-primary">Terms And Condition</Link></label>
                                            </div>
                                        </form>
                                    </div>
                                </Modal.Body>
                            </Modal>
                        
                            <h5 className="mt-4">Author:</h5>

                            <div className="row">
                                <div className="col-md-6 mt-4">
                                    <div className="card nft-creator nft-creator-primary border-0 rounded-md shadow">
                                        <div className="card-body p-3">
                                            <div className="pb-3 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-soft rounded-pill">No. #1</span>
            
                                                    <Link to="/nft-collection" className="text-dark h5 mb-0 read-more"><i className="uil uil-arrow-circle-right"></i></Link>
                                                </div>
                                            </div>
            
                                            <div className="content mt-3">
                                                <div className="position-relative text-center">
                                                    <img src={client1} className="avatar avatar-small rounded-pill shadow" alt=""/>
                                                    
                                                    <div className="author mt-2">
                                                        <Link to="/nft-creator-profile" className="text-dark h6 name">Jordan Joo</Link>
                                                        <small className="d-block fw-medium mt-1 text-dark">0.75<span className="text-muted">ETH</span></small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6 mt-4">
                                    <div className="card nft-creator nft-creator-success border-0 rounded-md shadow">
                                        <div className="card-body p-3">
                                            <div className="pb-3 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-soft rounded-pill">No. #2</span>
            
                                                    <Link to="/nft-collection" className="text-dark h5 mb-0 read-more"><i className="uil uil-arrow-circle-right"></i></Link>
                                                </div>
                                            </div>
            
                                            <div className="content mt-3">
                                                <div className="position-relative text-center">
                                                    <img src={client2} className="avatar avatar-small rounded-pill shadow" alt=""/>
                                                    
                                                    <div className="author mt-2">
                                                        <Link to="/nft-creator-profile" className="text-dark h6 name">Sofia Malik</Link>
                                                        <small className="d-block fw-medium mt-1 text-dark">0.75<span className="text-muted">ETH</span></small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="section-title">
                            <h4 className="mb-0">Popular Items</h4>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="nft-explore.html" className="btn btn-primary">See More <FiArrowRight /></Link>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <div className="tiny-five-item">
                            <TinySlider settings={settings}>
                                {workData.map((item, index) =>{
                                    return(
                                        <div className="tiny-slide" key={index}>
                                            <div className="nft-items nft-item-primary">
                                                <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                                    <img src={item.image3} className="img-fluid" alt=""/>
                                                    <div className="pop-icon">
                                                        <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="
                                                        
                                                        text-dark"/></Link>
                                                    </div>
                                                </div>
                    
                                                <div className="content pt-3">
                                                    <Link to="nft-item-detail.html" className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                                    <small className="gradient-text d-block">{item.value}</small>
                    
                                                    <ul className="pt-3 mt-2 border-top d-flex justify-content-between align-items-center list-unstyled">
                                                        <li className="d-flex author align-items-center">
                                                            <div className="position-relative">
                                                                <img src={item.clientImg} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                                <div className="position-absolute top-0 start-0 translate-middle pt-2 ps-2">
                                                                    <i className="mdi mdi-check-circle mdi-18px text-success"></i>
                                                                </div>
                                                            </div>
                                                            <Link to="nft-creator-profile.html" className="ps-2 text-dark name">{item.name}</Link>
                                                        </li>
                    
                                                        <li>
                                                            <span>{item.like}<Link to="#" className="like"><i className="mdi mdi-heart align-middle ms-1"></i></Link></span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </TinySlider>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
        
    )
}