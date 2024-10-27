const Main = () => {
    
    return ( 

        <div className="font-silkscreen bg-[#C6E7C6] h-screen flex flex-col items-center">
            <img className = "object-fill h-45 w-60 mt-20 mb-10" src="/public/compt.gif" alt="" />
            <h1 className="mb-10">Welcome !!</h1>

            <form className="text-left flex flex-col gap-5" action="">

                <div className="flex flex-col">
                    <label className="" for="Subject">Choose subject:</label>
                    <select className="w-80 -ms-42" name="subject" id="subject">
                        <option className="w-80 -ms-42" value="Math">Math</option>
                        <option className="w-80 -ms-42" value="Biology">Biology</option>
                        <option className="w-80 -ms-42" value="Computer Science">Computer Science</option>
                    </select> 
                </div>

                <div className="flex flex-col">
                    <label className="">Select Class:</label>
                    <select className="w-80 -ms-42" name="subject" id="subject">
                        <option className="w-80 -ms-42" value="121">121</option>
                        <option className="w-80 -ms-42" value="274">274</option>
                        <option className="w-30 -ms-42" value="341">341</option>
                    </select>
                </div>

                <button className = "w-30 bg-[#DAB1DA] hover:bg-[#CA8ECA] text-white font-bold py-2 px-4 border-b-4 border-[#CA8ECA] hover:border-[#CA8ECA] rounded">
                Connect 
                </button>
            </form>

        </div>
     );
}
 
export default Main;