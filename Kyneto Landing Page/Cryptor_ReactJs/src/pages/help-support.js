import React from "react";

import bg1 from '../assets/images/bg/market.png'
import Navbar from "../components/navbar";
import LinkTabThree from "../components/linkTabThree";

import { FiUser, FiMail, FiBook, FiMessageCircle } from '../assets/icons/vander'
import Footer from "../components/footer";

export default function HelpSupport() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />
            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Support</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <LinkTabThree />

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-7 col-12">
                            <div className="rounded p-4 shadow">
                                <div className="row">
                                    <div className="col-12">
                                        <form>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Your Name <span className="text-danger">*</span></label>
                                                        <div className="form-icon position-relative">
                                                            <FiUser className="fea icon-sm icons" />
                                                            <input name="name" id="name" type="text" className="form-control ps-5" placeholder="First Name :" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Your Email <span className="text-danger">*</span></label>
                                                        <div className="form-icon position-relative">
                                                            <FiMail className="fea icon-sm icons" />
                                                            <input name="email" id="email" type="email" className="form-control ps-5" placeholder="Your email :" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="mb-3">
                                                        <label className="form-label">Subject</label>
                                                        <div className="form-icon position-relative">
                                                            <FiBook className="fea icon-sm icons" />
                                                            <input name="subject" id="subject" className="form-control ps-5" placeholder="Your subject :" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="mb-3">
                                                        <label className="form-label">Comments</label>
                                                        <div className="form-icon position-relative">
                                                            <FiMessageCircle className="fea icon-sm icons" />
                                                            <textarea name="comments" id="comments" rows="4" className="form-control ps-5" placeholder="Your Message :"></textarea>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-sm-12">
                                                    <input type="submit" name="send" className="btn btn-primary" value="Send Request" />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}