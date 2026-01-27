import React from "react";
import { Link } from "react-router-dom";

import {TbMailStar} from '../assets/icons/vander'

export default function FooterTopTwo(){
    return(
        <div className="bg-footer">
            <div className="container-fluid px-0">
                <div className="py-5">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div className="section-title">
                                    <div className="d-flex">
                                        <TbMailStar className="display-4 text-white title-dark"/>
                                        <div className="flex-1 ms-md-4 ms-3">
                                            <h4 className="fw-medium text-light title-dark mb-1">Get the latest Cryptor news in your inbox.</h4>
                                            <p className="text-white-50 mb-0">Sign up and receive the latest tips via email.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div className="col-md-4 mt-4 mt-sm-0">
                                <div className="text-md-end ms-5 ms-sm-0">
                                    <Link to="#" className="btn btn-primary">Subscribe Now</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}