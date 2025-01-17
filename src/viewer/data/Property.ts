import {PropertySet} from "./PropertySet";
import {PropertyParams} from "./PropertyParams";

/**
 * A property of a model or object within a {@link Viewer}.
 *
 * ## Overview
 *
 * * Belongs to a {@link PropertySet}
 * * Registered by {@link Property.id} in {@link PropertySet.properties}
 * * Created with {@link PropertySet.createProperty}
 */
class Property {

    /**
     * The PropertySet to which this Property belongs.
     */
    public readonly propertySet: PropertySet;

    /**
     * The name of this property.
     */
    public readonly name: string;

    /**
     * The type of this property.
     */
    public readonly type: string | number;

    /**
     * The value of this property.
     */
    public readonly value: any;

    /**
     * The type of this property's value.
     */
    public readonly valueType: string | number;

    /**
     * Informative text to explain the property.
     */
    public readonly description: string;

    /**
     * @private
     * @ignore
     */
    constructor(
        propertySet: PropertySet,
        propertyCfg: PropertyParams) {
        this.propertySet = propertySet;
        this.name = propertyCfg.name;
        this.type = propertyCfg.type
        this.value = propertyCfg.value
        this.valueType = propertyCfg.valueType;
        this.description = propertyCfg.description;
    }
}

export {Property};