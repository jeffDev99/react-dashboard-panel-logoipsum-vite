import React, { useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Input from "../../Components/Input/Input";
import Button from "../../Components/Button/Button";
import * as Yup from "yup"; // Import Yup
import RadioButtonGroup from "../../Components/RadioButtonGroup/RadioButtonGroup";
import { mainUrl } from "../../helpers/constants/env-varaibles";
import "./MLMethods.css";
export default function MLMethods() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("use only xlsx or csv format");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUpload, setIsUpload] = useState(false);
  const [fileData, setFileData] = useState(null);
  const fileInputRef = useRef();
  const [selectedValue, setSelectedValue] = useState("EDRVFL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({}); // State for storing validation errors

  const handleRadioChange = (value) => {
    setSelectedValue(value);
    setError("");
  };
  const options = [
    { label: "EDRVFL", value: "EDRVFL" },
    { label: "LightGBM", value: "LightGBM" },
    { label: "Ridge", value: "Ridge" },
    { label: "WKRidge", value: "WKRidge" },
    { label: "XGBoost", value: "XGBoost" },
  ];

  const validationSchema = Yup.object({
    radioGroup: Yup.string().required("Please select an option"),
  });
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log(file);
    setSelectedFile(file);
    setFileName(file ? file.name : "use only xlsx or csv format");
  };

  const handleUpload = async () => {
    
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "No file selected",
        text: "Please select a file first!",
      });
      return;
    }
    const formData = new FormData();
    formData.append("original_file", selectedFile);
    formData.append("algorithm_name", selectedValue);
    const token = Cookies.get("authToken");
    try {
      setLoading(true);
      const response = await axios.post(`${mainUrl}ml/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      if (response.status === 200) {
        setFileData(response.data);
        setIsUpload(true)
        Swal.fire({
          icon: "success",
          title: "Upload Successful",
          text: "File uploaded successfully! You Can Download File From Download Button",
        });
      } else {
        setIsUpload(false)
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Failed to upload file.",
        });
      }
    } catch (error) {
      if (error.code === "ERR_NETWORK") {
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Please Check Your Internet Connection.",
        }).then((result) => {
          setError("");
        });
      } else if (error.code === "ERR_BAD_REQUEST") {
        Swal.fire({
          icon: "error",
          title: "Input Error",
          text: "Please Check Your Excel File",
        }).then((result) => {
          setError("");
        });
      } else if (error.code === "ERR_BAD_RESPONSE" || error.code === "ETIMEDOUT") {
        Swal.fire({
          icon: "error",
          title: "ُServer Error",
          text: "Please Contact To Support",
        }).then((result) => {
          setError("");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "There Is Some Error",
          text: "Please Contact To Support.",
        }).then((result) => {
          setError("");
        });
      }
      console.error("Error uploading file:", error.code);
    }finally{
      setLoading(false);
    }
  };

  const validateForm = () => {
    validationSchema
      .validate({ radioGroup: selectedValue }, { abortEarly: false })
      .then(() => {
        setError("");
        handleUpload(); // Assuming this function will handle the form submission
      })
      .catch((err) => {
        const newErrors = {};
        err.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
        setError(newErrors);
      });
  };

  const handleDownload = async () => {
    if (!fileData) {
      Swal.fire({
        icon: "warning",
        title: "No File Available",
        text: "No file available for download.",
      });
      return;
    }
    try {
      const blob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.xlsx" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || "downloaded_file.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      Swal.fire({
        icon: "error",
        title: "Download Error",
        text: "An error occurred while downloading the file.",
      });
    }
  };

  const handleCancelDownload = () => {
    Swal.fire({
      title: "Do you want to Cancel the Process?",
      showDenyButton: true,
      confirmButtonText: "Yes",
      denyButtonText: `No`,
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedFile(null);
        setFileName("use only xlsx or csv format");
        setUploadProgress(0);
        setFileData(null);
        setIsUpload(false)
        if (fileInputRef.current.value) {
          fileInputRef.current.value = ""; // This will reset the file input value : for chrome bug
        }
      } else if (result.isDenied) {
        return;
      }
    });
  };
  return (
    <div className="d-flex flex-column h-100 justify-content-between">
      <div className="row ">
        <div className="col-12 col-lg-2">
          <h4 className="input-title mb-3">Select Method</h4>
          <div>
            <RadioButtonGroup options={options} name="radioGroup" selectedValue={selectedValue} onChange={handleRadioChange} />
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <h4 className="input-title mb-3">Please Input your Excel Files here.</h4>
          <form className="d-flex flex-column">
            <Input type="file" ref={fileInputRef} name="missingDataFile" label={fileName} onInputChange={handleFileChange} isFileUploaded={uploadProgress == 100 ? true : false}></Input>
          </form>
          {loading && <div className="loader"></div>}
          {uploadProgress > 0 && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ width: "100%", backgroundColor: "#D0D5DD80", borderRadius: "42px" }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "20px",
                    background: "linear-gradient(224.47deg, #58ABFF 8.18%, #007DFC 95.84%)",
                    borderRadius: "42px",
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className="col-12 col-lg-2">
          <div className="ms-lg-3 mt-3 mt-lg-0" style={{ paddingTop: "40px" }}>
            <Button value="Upload" variant={uploadProgress == 100 ? "primary" : "outline"} className="ms-3" onBtnClick={validateForm}></Button>
          </div>
        </div>
        <div className="col-12 col-lg-2"></div>
      </div>
      <div className={isUpload ? "d-block" : "d-none"}>
        <div className="row">
          <div className="col-12 col-lg-6">
            <Button value="Cancel" variant="outline" className="ms-3" onBtnClick={handleCancelDownload}></Button>
          </div>
          <div className="col-12 col-lg-6">
            <div className="d-flex  justify-content-end">
              <Button value="Download File" variant="primary" className="ms-3" onBtnClick={handleDownload}></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
