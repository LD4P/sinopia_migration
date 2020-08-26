import shortid from 'shortid'
import _ from 'lodash'

/**
 * Builds a resource model from a subject template.
 * Just enough properties are added to allow building a graph with the GraphBuilder.
 */
export default class TemplatesToResourceBuilder {
  constructor(subjectTemplate) {
    this.subjectTemplate = subjectTemplate
    this.resource = null
  }

  /**
   * @return {Object} resource
   */
  build() {
    this.buildFromSubjectTemplate()
    const propertyTemplatesProperty = this.newProperty(this.resource, 'http://sinopia.io/vocabulary/hasPropertyTemplate', 'resource', true)
    this.resource.properties.push(propertyTemplatesProperty)
    this.subjectTemplate.propertyTemplates.forEach((propertyTemplate) => this.buildFromPropertyTemplate(propertyTemplate, propertyTemplatesProperty))
    return this.resource
  }

  buildFromSubjectTemplate() {
    const subject = this.newSubject('sinopia:template:resource', 'http://sinopia.io/vocabulary/ResourceTemplate')
    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasResourceId', [{uri: this.subjectTemplate.id}])
    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasClass', [{uri:this.subjectTemplate.class}])
    this.buildLiteralProperty(subject, 'http://www.w3.org/2000/01/rdf-schema#label', [{literal: this.subjectTemplate.label}])
    this.buildLiteralProperty(subject, 'http://sinopia.io/vocabulary/hasAuthor', [{literal: this.subjectTemplate.author}])
    this.buildLiteralProperty(subject, 'http://sinopia.io/vocabulary/hasRemark', [{literal: this.subjectTemplate.remark}])
    this.buildLiteralProperty(subject, 'http://sinopia.io/vocabulary/hasDate', [{literal: this.subjectTemplate.date}])
    this.resource = subject
  }

  newSubject(subjectTemplateId, subjectTemplateClass) {
    const key = shortid.generate()
    return {
      key,
      uri: null,
      subjectTemplate: {
        id: subjectTemplateId,
        class: subjectTemplateClass
      },
      properties: [],
    }
  }

  buildLiteralProperty(subject, propertyUri, literals) {
    if(_.isEmpty(literals)) return
    const property = this.newProperty(subject, propertyUri, 'literal')
    subject.properties.push(property)
    literals.forEach((literal) => {
      if(literal.literal) property.values.push(this.newLiteralValue(property, literal.literal, literal.lang))
    })

  }

  buildUriProperty(subject, propertyUri, uris, ordered) {
    if(_.isEmpty(uris)) return
    const property = this.newProperty(subject, propertyUri, 'uri', ordered)
    subject.properties.push(property)
    uris.forEach((uri) => {
      if(uri.uri) property.values.push(this.newUriValue(property, uri.uri, uri.label))
    })
  }

  newProperty(subject, propertyUri, propertyType, ordered) {
    return {
      key: shortid.generate(),
      subject,
      propertyTemplate: { uri: propertyUri, type: propertyType, ordered: !!ordered},
      values: [],
    }
  }

  buildFromPropertyTemplate(propertyTemplate, propertyTemplatesProperty) {
    const subject = this.newSubject('sinopia:template:property', 'http://sinopia.io/vocabulary/PropertyTemplate')
    propertyTemplatesProperty.values.push(this.newValueSubject(propertyTemplatesProperty, subject))
    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasPropertyUri', [{uri: propertyTemplate.uri}])
    this.buildLiteralProperty(subject, 'http://www.w3.org/2000/01/rdf-schema#label', [{literal: propertyTemplate.label}])
    this.buildLiteralProperty(subject, 'http://sinopia.io/vocabulary/hasRemark', [{literal: propertyTemplate.remark}])
    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasRemarkUrl', [{uri: propertyTemplate.remarkUrl}])

    const propertyAttrUris = []
    if(propertyTemplate.required) propertyAttrUris.push({uri: 'http://sinopia.io/vocabulary/propertyAttribute/required'})
    if(propertyTemplate.repeatable) propertyAttrUris.push({uri: 'http://sinopia.io/vocabulary/propertyAttribute/repeatable'})
    if(propertyTemplate.ordered) propertyAttrUris.push({uri: 'http://sinopia.io/vocabulary/propertyAttribute/ordered'})
    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasPropertyAttribute', propertyAttrUris)

    this.buildUriProperty(subject, 'http://sinopia.io/vocabulary/hasPropertyType', [{uri: `http://sinopia.io/vocabulary/propertyType/${propertyTemplate.type}`}])

    // Literal
    if(propertyTemplate.type === 'literal' && !_.isEmpty(propertyTemplate.defaults)) {
      const literalAttributesProperty = this.newProperty(subject, 'http://sinopia.io/vocabulary/hasLiteralAttributes', 'resource')
      subject.properties.push(literalAttributesProperty)
      const literalSubject = this.newSubject('sinopia:template:property:literal', 'http://sinopia.io/vocabulary/LiteralPropertyTemplate')
      literalAttributesProperty.values.push(this.newValueSubject(literalAttributesProperty, literalSubject))
      this.buildLiteralProperty(literalSubject, 'http://sinopia.io/vocabulary/hasDefault', propertyTemplate.defaults)
    }

    // URI
    if(propertyTemplate.type === 'uri' && _.isEmpty(propertyTemplate.authorities) && !_.isEmpty(propertyTemplate.defaults)) {
      const uriAttributesProperty = this.newProperty(subject, 'http://sinopia.io/vocabulary/hasUriAttributes', 'resource')
      subject.properties.push(uriAttributesProperty)
      const uriSubject = this.newSubject('sinopia:template:property:uri', 'http://sinopia.io/vocabulary/UriPropertyTemplate')
      uriAttributesProperty.values.push(this.newValueSubject(uriAttributesProperty, uriSubject))
      // this.buildUriProperty(uriSubject, 'http://sinopia.io/vocabulary/hasDefault', propertyTemplate.defaults)
      this.buildUriDefaults(uriSubject, propertyTemplate)
    }

    // Lookup
    if(propertyTemplate.type === 'uri' && !_.isEmpty(propertyTemplate.authorities)) {
      const lookupAttributesProperty = this.newProperty(subject, 'http://sinopia.io/vocabulary/hasLookupAttributes', 'resource')
      subject.properties.push(lookupAttributesProperty)
      const lookupSubject = this.newSubject('sinopia:template:property:lookup', 'http://sinopia.io/vocabulary/LookupPropertyTemplate')
      lookupAttributesProperty.values.push(this.newValueSubject(lookupAttributesProperty, lookupSubject))
      // this.buildUriProperty(lookupSubject, 'http://sinopia.io/vocabulary/hasDefault', propertyTemplate.defaults)
      this.buildUriDefaults(lookupSubject, propertyTemplate)
      const authorityUris = propertyTemplate.authorities.map((authority) => {
        return { uri: authority.uri }
      })
      this.buildUriProperty(lookupSubject, 'http://sinopia.io/vocabulary/hasAuthority', authorityUris)
    }

    // Nested resource
    if(propertyTemplate.type === 'resource') {
      const resourceAttributesProperty = this.newProperty(subject, 'http://sinopia.io/vocabulary/hasResourceAttributes', 'resource')
      subject.properties.push(resourceAttributesProperty)
      const resourceSubject = this.newSubject('sinopia:template:property:resource', 'http://sinopia.io/vocabulary/ResourcePropertyTemplate')
      resourceAttributesProperty.values.push(this.newValueSubject(resourceAttributesProperty, resourceSubject))
      const templateUris = propertyTemplate.valueSubjectTemplateKeys.map((key) => {
        return {uri: key}
      })
      this.buildUriProperty(resourceSubject, 'http://sinopia.io/vocabulary/hasResourceTemplateId', templateUris)
    }

  }

  buildUriDefaults(uriSubject, propertyTemplate) {
    // (uriSubject, 'http://sinopia.io/vocabulary/hasDefault', propertyTemplate.defaults)
    const defaultsProperty = this.newProperty(uriSubject, 'http://sinopia.io/vocabulary/hasDefault', 'resource')
    uriSubject.properties.push(defaultsProperty)

    propertyTemplate.defaults.forEach((defaultUri) => {
      const defaultSubject = this.newSubject('sinopia:template:uri', 'http://sinopia.io/vocabulary/Uri')
      defaultsProperty.values.push(this.newValueSubject(defaultsProperty, defaultSubject))
      this.buildUriProperty(defaultSubject, 'http://sinopia.io/vocabulary/hasUri', [{ uri: defaultUri.uri }])
      if(defaultUri.label) this.buildLiteralProperty(defaultSubject, 'http://www.w3.org/2000/01/rdf-schema#label', [{ literal: defaultUri.label }])
    })
  }

  newValue(property, literal, lang, uri, label, valueSubject) {
    const key = shortid.generate()
    const resourceKey = property.resourceKey
    return {
      key,
      property,
      resourceKey,
      literal,
      lang,
      uri,
      label,
      valueSubject,
    }
  }

  newLiteralValue(property, literal, lang) {
    return this.newValue(property, literal, lang, null, null, null)
  }

  newUriValue(property, uri, label) {
     return this.newValue(property, null, null, uri, label, null)
  }

  newValueSubject(property, subject){
    return this.newValue(property, null, null, null, null, subject)
  }
}
