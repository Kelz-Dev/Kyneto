import React, { useState } from "react";

import hero from "../assets/images/hero/03.png"

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

export default function NftBecomeCreator(){
    const [file, setFile] = useState('');

    function handleChange(e) {
        console.log(e.target.files);
        setFile(URL.createObjectURL(e.target.files[0]));
    }
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 d-table w-100 bg-light">
            <div className="container">
                <div className="row align-items-center mt-5">
                    <div className="col-md-8">
                        <div className="title-heading">
                            <h4 className="heading fw-bold title-dark mb-4">Start Your <span className="gradient-text">NFT Journey</span></h4>

                            <p className="text-muted para-desc">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>

                        </div>
                    </div>

                    <div className="col-md-4">
                        <img src={hero} className="img-fluid" alt=""/>
                    </div>
                </div>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10 col-md-8 mt-4 mt-sm-0 pt-2 pt-sm-0">
                        <div className="row shadow rounded-md p-3">
                            <div className="col-lg-4 col-12 mt-3">
                                <p className="fw-semibold mb-3">Upload your ART here, Please click "Upload Image" Button.</p>
                                {file === '' ? 
                                    <div className="flex justify-content-center rounded shadow overflow-hidden bg-light p-2 text-center text-muted">Supports JPG, PNG and MP4 videos. Max file size : 10MB.</div> :
                                    <div className="preview-box d-block justify-content-center rounded shadow overflow-hidden bg-light p-1">
                                        <img className="preview-content w-100" src={file} alt="" />
                                    </div>
                                }
                            <input type="file" id="input-file" name="input-file" accept="image/*" onChange={handleChange} hidden />
                            <label className="btn-upload btn btn-primary mt-4" htmlFor="input-file">Upload File</label>
                            </div>
        
                            <div className="col-lg-8 col-12">
                                <form className="mt-3">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">Display Name :<span className="text-danger">*</span></label>
                                                <input name="name" id="name" type="text" className="form-control shadow" placeholder="Name :"/>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">URL :</label>
                                                <input name="subject" id="subject" className="form-control shadow" placeholder="URL"/>
                                            </div>                                                                               
                                        </div>
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">Bio :</label>
                                                <textarea name="comments" id="comments" rows="4" className="form-control shadow" placeholder="Text Bio..... "></textarea>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">Twitter Account :<span className="text-danger">*</span></label>
                                                <input name="name2" id="name2" type="text" className="form-control shadow" placeholder="Twitter Profile Name"/>
                                            </div> 
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-sm-12">
                                            <input type="submit" id="submit" name="send" className="submitBnt btn btn-primary" value="Creat Your Account"/>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}