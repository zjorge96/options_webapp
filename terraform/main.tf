# Configure the Azure provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.30.0"
    }
  }
  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

locals {
  name       = "zach-webstocks-3KS"
  location   = "westus"
  image_name = "zjliatrio/webstocks:latest"
  tags = {
    environment = "webstocks",
    owner       = "bengal"
  }
}

# Create a resource group
resource "azurerm_resource_group" "rg" {
  name     = "${local.name}-rg"
  location = local.location
  tags     = local.tags
}

# Create the Linux App Service Plan
resource "azurerm_service_plan" "asp" {
  name                = "${local.name}-asp"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "S1"
  os_type             = "Linux"
  tags                = local.tags
}

# Run shell command to deploy the webapp building from the local Dockerfile
resource "null_resource" "run_shell" {
  provisioner "local-exec" {
    command = "az webapp create --resource-group ${azurerm_resource_group.rg.name} --plan ${azurerm_service_plan.asp.name} --name ${local.name}-app --deployment-container-image-name ${local.image_name}"
  }
}
