type UUID = string & { _readonly_uuid_brand: unique symbol };

export default UUID;