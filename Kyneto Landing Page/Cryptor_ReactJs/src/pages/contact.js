import { useState } from 'react';
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import Navbar from "../components/navbar";

import Modal from 'react-bootstrap/Modal';
import { FiPhone, FiMail, FiMapPin } from '../assets/icons/vander'
import Footer from '../components/footer';

export default function Contact() {
    const [show, setShow] = useState(false);
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Contact Us</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="features-absolute bg-white p-4 p-md-5 rounded shadow">
                                <div className="custom-form">
                                    <form>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-floating mb-3">
                                                    <input name="name" id="name" type="text" className="form-control" placeholder="Name :" />
                                                    <label>Your Name</label>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="form-floating mb-3">
                                                    <input name="email" id="email" type="email" className="form-control" placeholder="Email :" />
                                                    <label>Email address</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating mb-3">
                                                    <input name="subject" id="subject" className="form-control" placeholder="subject :" />
                                                    <label>Subject</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating mb-3">
                                                    <textarea name="comments" id="comments" style={{ height: '150px' }} className="form-control" placeholder="Leave a comment here"></textarea>
                                                    <label>Comments</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="d-grid">
                                                    <button type="submit" id="submit" name="send" className="btn btn-primary">Send Message</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row">
                        <div className="col-lg-4 col-md-6">
                            <div className="feature feature-primary feature-clean text-center rounded px-4">
                                <div className="icons text-center">
                                    <FiPhone className="icon d-block mx-auto rounded h3 mb-0" />
                                </div>

                                <div className="card-body p-0 mt-4">
                                    <h5 className="">Phone</h5>
                                    <p className="text-muted">Start working with Landflow that can provide everything</p>
                                    <Link to="tel:+152534-468-854" className="link">+152 534-468-854</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="feature feature-primary feature-clean text-center rounded px-4">
                                <div className="icons text-center">
                                    <FiMail className="icon d-block mx-auto rounded h3 mb-0" />
                                </div>

                                <div className="card-body p-0 mt-4">
                                    <h5 className="">Email</h5>
                                    <p className="text-muted">Start working with Landflow that can provide everything</p>
                                    <Link to="mailto:contact@example.com" className="link">contact@example.com</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4 col-md-6 mt-4 mt-lg-0 pt-2 pt-lg-0">
                            <div className="feature feature-primary feature-clean text-center rounded px-4">
                                <div className="icons text-center">
                                    <FiMapPin className="icon d-block mx-auto rounded h3 mb-0" />
                                </div>

                                <div className="card-body p-0 mt-4">
                                    <h5 className="">Location</h5>
                                    <p className="text-muted">C/54 Northwest Freeway, Suite 558, <br />Houston, USA 485</p>
                                    <Link to="#" onClick={() => setShow(true)} className="video-play-icon h6 link">View on Google map</Link>
                                </div>
                                <Modal show={show} size='lg' centered onHide={() => setShow(false)}>
                                    <Modal.Body className='p-0'>
                                        <div className="modal-content video-modal rounded overflow-hidden">
                                            <div className="ratio ratio-16x9">
                                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39206.002432144705!2d-95.4973981212445!3d29.709510002925988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c16de81f3ca5%3A0xf43e0b60ae539ac9!2sGerald+D.+Hines+Waterwall+Park!5e0!3m2!1sen!2sin!4v1566305861440!5m2!1sen!2sin" title="Vimeo video" allowFullScreen></iframe>
                                            </div>
                                        </div>
                                    </Modal.Body>
                                </Modal>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 p-0">
                        <div className="card map border-0">
                            <div className="card-body p-0">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d39206.002432144705!2d-95.4973981212445!3d29.709510002925988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c16de81f3ca5%3A0xf43e0b60ae539ac9!2sGerald+D.+Hines+Waterwall+Park!5e0!3m2!1sen!2sin!4v1566305861440!5m2!1sen!2sin" style={{ border: "0" }} title='myframe' allowFullScreen></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}