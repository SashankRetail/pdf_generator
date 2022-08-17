export const generatePdfTypedef = `
    type pdfResponse {
        code: Int,
        message: String,
        data: JSON
    }

    type Query {_dummy: String}
    type Mutation{
        generateBookingFormPdf(
            modularAmount: Float
            dcCode : String
            closeDate : DateTime
            clientName : String
            phoneNumber : String
            emailId: String
            projectType : String
            scopeOfWork : String
            civilWorkRequired : Boolean
            currentAddress : JSON
            projectAddress : JSON
            proposedValue : Float
            signupValue : Float
            modularDiscount : Float
            siteServicesDiscount : Float
            siteServicesAmount : Float
            decorAmount : Float
            fivePercentageProjectValue : Float
            signupAmount : Float
            basicFramesofExternalDoorsAndWindows:Boolean
            reqdDoorsAndWindowsInstalled :Boolean
            basicAllWallsCompleted :Boolean
            reqdPuttyCoatOfPlasteringOnWalls:Boolean
            basicFloorsLeveledOutAndPrepped:Boolean
            reqdFlooringIsCompleted:Boolean
            notes: String
            pan: String
            gst: String
            wohooCard:String
            remarkFromSales:String
            salesManagerName:String
            salesManagerMobile:String
            salesManagerEmail:String,
            leadId:String,
            customerId: Int
        ):pdfResponse
    
        generateProposalPdf(
            pdfName:String,
            leadId:String,
            parsedData:JSON,
            roomsArray:JSON,
            discount:Int,
            absoluteDiscount:Int,
            opportunityId:String,
            clientOrProjectName:String,
        ):pdfResponse
    }
    scalar JSON
    scalar DateTime
`;
