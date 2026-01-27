import React, {useState} from "react";
import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

export default function NftUplodDetail(){
    const [file, setFile] = useState('');

    function handleChange(e) {
        console.log(e.target.files);
        setFile(URL.createObjectURL(e.target.files[0]));
    }
    return(
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>
            <section className="bg-half-100 bg-light d-table w-100">
                <div className="container position-relative" style={{zIndex:'1'}}>
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title fw-medium mb-4">Item Detail</h4>
                                <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="position-absolute top-50 start-50 mt-4 translate-middle">
                    <img src="images/icon-gradient.png" className="img-fluid opacity-2" style={{maxHeight:'300px'}} alt=""/>
                </div>
            </section>
       

        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-md-4">
                        <div className="d-grid">
                            <p className="text-muted">Upload your Product image here, Please click "Upload Image" Button.</p>
                            <div className="preview-box d-block justify-content-center rounded shadow overflow-hidden bg-light p-1">
                                <img className="preview-content w-100" src={file} alt="" />
                            </div>
                            <input type="file" id="input-file" name="input-file" accept="image/*"  hidden  onChange={handleChange}/>
                            <label className="btn-upload btn btn-primary mt-4" htmlFor="input-file">Upload File</label>
                        </div>
                    </div>

                    <div className="col-md-8 mt-4 mt-sm-0">
                        <div className="ms-md-4">
                            <form>
                                <div className="row">
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Item Title <span className="text-danger">*</span></label>
                                            <input name="name" id="name" type="text" className="form-control" placeholder="Title :"/>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label"> Author: </label>
                                            <input name="name" id="name2" type="text" className="form-control" placeholder="Title :"/>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label"> Time to read : </label>
                                            <input name="time" type="text" className="form-control" id="time" defaultValue="5 min read"/>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Tag</label>
                                            <select className="form-control">
                                                <option defaultValue="ART">Art</option>
                                                <option defaultValue="CREATIVE">Creative</option>
                                                <option defaultValue="CLEAN">Clean</option>
                                                <option defaultValue="DIGITAL">Digital</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label"> Pricing : </label>
                                            <input name="number" type="number" className="form-control" id="number" placeholder="$15"/>
                                        </div>
                                    </div>

                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="form-label">Description <span className="text-danger">*</span></label>
                                            <textarea name="comments" id="comments" rows="4" className="form-control" placeholder="Item detail :"></textarea>
                                        </div>
                                    </div>

                                    <div className="col-lg-12 text-end">
                                        <button type="submit" className="btn btn-primary">Upload Now</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}