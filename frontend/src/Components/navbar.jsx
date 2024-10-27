const Navbar = () => {
    const arr = [1,1,1,1,1,1,1,1,1,1 ]
    return (
    <div className="bg-[#F2CFF2] h-[3rem] flex flex-row gap-9 items-center font-silkscreen text-sm">
        {arr.map((elem,indx) => {
            return (
                <h4>Chat & Learn</h4>
            )
        })}
    </div>
    )
}

export default Navbar;